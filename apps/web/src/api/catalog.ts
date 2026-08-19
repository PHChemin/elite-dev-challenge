import { apiGet } from './client';
import type {
  CatalogCreditsResponse,
  CatalogSearchResponse,
  CatalogUpcomingResponse,
} from './types';

export async function searchMovies(query: string) {
  const { results } = await apiGet<CatalogSearchResponse>('/catalog/movies', {
    q: query,
  });
  return results;
}

export function getUpcomingMovies(page = 1): Promise<CatalogUpcomingResponse> {
  return apiGet<CatalogUpcomingResponse>('/catalog/upcoming', { page });
}

export function getMovieCredits(
  tmdbId: string,
): Promise<CatalogCreditsResponse> {
  return apiGet<CatalogCreditsResponse>(`/catalog/movies/${tmdbId}/credits`);
}
