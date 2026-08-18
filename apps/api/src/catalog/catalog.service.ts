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
import type { CatalogMovie, CatalogSearchResponse } from './catalog.types';

@Injectable()
export class CatalogService {
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
  };
}
