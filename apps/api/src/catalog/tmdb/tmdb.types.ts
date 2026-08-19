export type TmdbGenre = {
  id: number;
  name: string;
};

export type TmdbMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  overview?: string;
  runtime?: number;
  genres?: TmdbGenre[];
};

export type TmdbSearchResponse = {
  results?: TmdbMovie[];
};

export type TmdbUpcomingResponse = {
  page?: number;
  results?: TmdbMovie[];
  total_pages?: number;
};

export type TmdbCastMember = {
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type TmdbCreditsResponse = {
  cast?: TmdbCastMember[];
};
