import { apiGet } from './client';
import type { CatalogSearchResponse } from './types';

export async function searchMovies(query: string) {
  const { results } = await apiGet<CatalogSearchResponse>('/catalog/movies', {
    q: query,
  });
  return results;
}
