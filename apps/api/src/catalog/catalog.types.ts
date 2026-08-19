export type CatalogGenre = {
  id: number;
  name: string;
};

export type CatalogMovie = {
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  overview: string | null;
  genres: CatalogGenre[];
};

export type CatalogSearchResponse = {
  results: CatalogMovie[];
};

export type CatalogUpcomingResponse = {
  results: CatalogMovie[];
  page: number;
  totalPages: number;
};

export type CatalogCastMember = {
  name: string;
  character: string;
  profileUrl: string | null;
};

export type CatalogCreditsResponse = {
  cast: CatalogCastMember[];
};

export type ExhibitionMetadata = {
  runtimeMinutes: number | null;
  overview: string | null;
  releaseDate: string | null;
  genres: CatalogGenre[];
};
