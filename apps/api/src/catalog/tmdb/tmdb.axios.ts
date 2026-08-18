import axios, { type AxiosInstance } from 'axios';
import {
  TMDB_BASE_URL,
  TMDB_LANGUAGE,
  TMDB_TIMEOUT_MS,
} from './tmdb.constants';

export function createTmdbAxios(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: TMDB_BASE_URL,
    timeout: TMDB_TIMEOUT_MS,
    params: {
      api_key: apiKey,
      language: TMDB_LANGUAGE,
    },
  });
}
