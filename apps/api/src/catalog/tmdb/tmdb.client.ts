import { Inject, Injectable } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { TMDB_AXIOS } from './tmdb.constants';
import { TmdbNotFoundError, TmdbUnavailableError } from './tmdb.errors';
import type { TmdbMovie, TmdbSearchResponse } from './tmdb.types';

@Injectable()
export class TmdbClient {
  constructor(@Inject(TMDB_AXIOS) private readonly http: AxiosInstance) {}

  async searchMovies(query: string): Promise<TmdbMovie[]> {
    try {
      const { data } = await this.http.get<TmdbSearchResponse>(
        '/search/movie',
        {
          params: { query, include_adult: false },
        },
      );
      return Array.isArray(data.results) ? data.results : [];
    } catch (error) {
      this.rethrow(error);
    }
  }

  async getMovie(tmdbId: string): Promise<TmdbMovie> {
    try {
      const { data } = await this.http.get<TmdbMovie>(
        `/movie/${encodeURIComponent(tmdbId)}`,
      );
      if (typeof data.id !== 'number' || typeof data.title !== 'string') {
        throw new TmdbUnavailableError();
      }
      return data;
    } catch (error) {
      this.rethrow(error, { notFound: true });
    }
  }

  private rethrow(error: unknown, options?: { notFound?: boolean }): never {
    if (
      error instanceof TmdbUnavailableError ||
      error instanceof TmdbNotFoundError
    ) {
      throw error;
    }
    if (
      options?.notFound &&
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      throw new TmdbNotFoundError();
    }
    throw new TmdbUnavailableError();
  }
}
