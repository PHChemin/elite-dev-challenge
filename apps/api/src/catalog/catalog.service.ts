import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { TMDB_POSTER_BASE_URL } from './tmdb/tmdb.constants';
import { TmdbClient } from './tmdb/tmdb.client';
import { TmdbNotFoundError, TmdbUnavailableError } from './tmdb/tmdb.errors';
import type { TmdbMovie } from './tmdb/tmdb.types';
import type {
  CatalogCastMember,
  CatalogCreditsResponse,
  CatalogMovie,
  CatalogSearchResponse,
  CatalogUpcomingResponse,
  ExhibitionMetadata,
} from './catalog.types';

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

@Injectable()
export class CatalogService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly tmdb: TmdbClient,
    private readonly i18n: I18nService,
  ) {}

  async search(query: string): Promise<CatalogSearchResponse> {
    try {
      const movies = await this.tmdb.searchMovies(query);
      return { results: movies.map(toCatalogMovie) };
    } catch (error) {
      this.throwUnavailable(error);
    }
  }

  async getUpcoming(page: number): Promise<CatalogUpcomingResponse> {
    const cacheKey = `upcoming:${page}`;
    const cached = this.readCache<CatalogUpcomingResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await this.tmdb.getUpcomingMovies(page);
      const response: CatalogUpcomingResponse = {
        results: (data.results ?? []).map(toCatalogMovie),
        page: data.page ?? page,
        totalPages: data.total_pages ?? 1,
      };
      this.writeCache(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof TmdbUnavailableError) {
        return { results: [], page, totalPages: 0 };
      }
      this.throwUnavailable(error);
    }
  }

  async getMovie(tmdbId: string): Promise<CatalogMovie> {
    try {
      return toCatalogMovie(await this.tmdb.getMovie(tmdbId));
    } catch (error) {
      if (error instanceof TmdbNotFoundError) {
        throw new NotFoundException(this.i18n.t('catalog.movieNotFound'));
      }
      this.throwUnavailable(error);
    }
  }

  async getMovieCredits(tmdbId: string): Promise<CatalogCreditsResponse> {
    const cacheKey = `credits:${tmdbId}`;
    const cached = this.readCache<CatalogCreditsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await this.tmdb.getMovieCredits(tmdbId);
      const cast = (data.cast ?? [])
        .slice()
        .sort((left, right) => left.order - right.order)
        .map(toCatalogCastMember);
      const response = { cast };
      this.writeCache(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof TmdbNotFoundError) {
        throw new NotFoundException(this.i18n.t('catalog.movieNotFound'));
      }
      this.throwUnavailable(error);
    }
  }

  toExhibitionMetadata(movie: CatalogMovie): ExhibitionMetadata {
    return {
      runtimeMinutes: movie.runtimeMinutes,
      overview: movie.overview,
      releaseDate: movie.releaseDate,
      genres: movie.genres,
    };
  }

  private readCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private writeCache(key: string, value: unknown): void {
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  private throwUnavailable(error: unknown): never {
    if (error instanceof TmdbUnavailableError) {
      throw new BadGatewayException(this.i18n.t('catalog.tmdbUnavailable'));
    }
    throw error;
  }
}

function toCatalogMovie(movie: TmdbMovie): CatalogMovie {
  return {
    tmdbId: String(movie.id),
    title: movie.title,
    posterUrl: movie.poster_path
      ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}`
      : null,
    releaseDate: movie.release_date ? movie.release_date : null,
    runtimeMinutes:
      typeof movie.runtime === 'number' && movie.runtime > 0
        ? movie.runtime
        : null,
    overview: movie.overview?.trim() ? movie.overview.trim() : null,
    genres: Array.isArray(movie.genres)
      ? movie.genres.map((genre) => ({ id: genre.id, name: genre.name }))
      : [],
  };
}

function toCatalogCastMember(member: {
  name: string;
  character: string;
  profile_path: string | null;
}): CatalogCastMember {
  return {
    name: member.name,
    character: member.character,
    profileUrl: member.profile_path
      ? `${TMDB_POSTER_BASE_URL}${member.profile_path}`
      : null,
  };
}
