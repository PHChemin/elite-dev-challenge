export type TmdbMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
};

export type TmdbSearchResponse = {
  results?: TmdbMovie[];
};
