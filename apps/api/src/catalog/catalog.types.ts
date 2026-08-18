export type CatalogMovie = {
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
};

export type CatalogSearchResponse = {
  results: CatalogMovie[];
};
