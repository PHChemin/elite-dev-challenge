import { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { TMDB_FIGHT_CLUB, TMDB_SEARCH_OK } from './tmdb-fixtures';

export { TMDB_FIGHT_CLUB, TMDB_SEARCH_OK };

function asResponse<T>(data: T, status: number): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 400 ? 'Error' : 'OK',
    headers: {},
    config: { headers: {} } as AxiosResponse<T>['config'],
  };
}

function httpError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = asResponse(data, status);
  error.status = status;
  return error;
}

export type TmdbAxiosMock = Pick<AxiosInstance, 'get'> & {
  get: jest.Mock;
};

export function createTmdbAxiosMock(options?: {
  search?: unknown;
  movie?: unknown;
  searchStatus?: number;
  movieStatus?: number;
  unreachable?: boolean;
}): TmdbAxiosMock {
  const get = jest.fn((url: string) => {
    if (options?.unreachable) {
      return Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK'));
    }

    if (url.includes('/search/movie')) {
      const status = options?.searchStatus ?? 200;
      const data = options?.search ?? TMDB_SEARCH_OK;
      if (status >= 400) {
        return Promise.reject(httpError(status, data));
      }
      return Promise.resolve(asResponse(data, status));
    }

    if (url.includes('/movie/')) {
      const status = options?.movieStatus ?? 200;
      const data = options?.movie ?? TMDB_FIGHT_CLUB;
      if (status >= 400) {
        return Promise.reject(httpError(status, data));
      }
      return Promise.resolve(asResponse(data, status));
    }

    return Promise.reject(
      httpError(500, { status_message: 'unknown TMDb path' }),
    );
  });

  return { get };
}
