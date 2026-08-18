import { Test, TestingModule } from '@nestjs/testing';
import {
  createTmdbAxiosMock,
  TMDB_FIGHT_CLUB,
  TMDB_SEARCH_OK,
  type TmdbAxiosMock,
} from '../../../test/helpers/tmdb-axios';
import { createTmdbAxios } from './tmdb.axios';
import { TmdbClient } from './tmdb.client';
import {
  TMDB_AXIOS,
  TMDB_BASE_URL,
  TMDB_LANGUAGE,
  TMDB_TIMEOUT_MS,
} from './tmdb.constants';
import { TmdbNotFoundError, TmdbUnavailableError } from './tmdb.errors';

describe('TmdbClient', () => {
  async function createClient(http: TmdbAxiosMock) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TmdbClient, { provide: TMDB_AXIOS, useValue: http }],
    }).compile();

    return module.get(TmdbClient);
  }

  it('searches movies with query and without adult titles', async () => {
    const http = createTmdbAxiosMock();
    const client = await createClient(http);

    await expect(client.searchMovies('clube da luta')).resolves.toEqual(
      TMDB_SEARCH_OK.results,
    );
    expect(http.get).toHaveBeenCalledWith('/search/movie', {
      params: { query: 'clube da luta', include_adult: false },
    });
  });

  it('loads movie details by id', async () => {
    const http = createTmdbAxiosMock();
    const client = await createClient(http);

    await expect(client.getMovie('550')).resolves.toEqual(TMDB_FIGHT_CLUB);
    expect(http.get).toHaveBeenCalledWith('/movie/550');
  });

  it('throws unavailable when TMDb cannot be reached', async () => {
    const client = await createClient(
      createTmdbAxiosMock({ unreachable: true }),
    );

    await expect(client.searchMovies('matrix')).rejects.toBeInstanceOf(
      TmdbUnavailableError,
    );
  });

  it('throws unavailable when TMDb responds with an error status', async () => {
    const client = await createClient(
      createTmdbAxiosMock({ searchStatus: 500 }),
    );

    await expect(client.searchMovies('matrix')).rejects.toBeInstanceOf(
      TmdbUnavailableError,
    );
  });

  it('throws not found when TMDb has no movie for the id', async () => {
    const client = await createClient(
      createTmdbAxiosMock({ movieStatus: 404 }),
    );

    await expect(client.getMovie('0')).rejects.toBeInstanceOf(
      TmdbNotFoundError,
    );
  });
});

describe('createTmdbAxios', () => {
  it('sets base URL, timeout, api key and pt-BR', () => {
    const instance = createTmdbAxios('test-tmdb-key');

    expect(instance.defaults.baseURL).toBe(TMDB_BASE_URL);
    expect(instance.defaults.timeout).toBe(TMDB_TIMEOUT_MS);
    expect(instance.defaults.params).toEqual({
      api_key: 'test-tmdb-key',
      language: TMDB_LANGUAGE,
    });
  });
});
