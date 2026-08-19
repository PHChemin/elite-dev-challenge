export const TMDB_FIGHT_CLUB = {
  id: 550,
  title: 'Clube da Luta',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  release_date: '1999-10-15',
  overview:
    'Um funcionário de escritório forma um clube de luta clandestino.',
  runtime: 139,
  genres: [{ id: 18, name: 'Drama' }],
};

export const TMDB_UPCOMING = {
  id: 999,
  title: 'Filme Futuro',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  release_date: '2027-01-01',
};

export const TMDB_SEARCH_OK = {
  page: 1,
  results: [TMDB_FIGHT_CLUB],
  total_pages: 1,
  total_results: 1,
};

export const TMDB_UPCOMING_OK = {
  page: 1,
  results: [TMDB_UPCOMING],
  total_pages: 1,
  total_results: 1,
};

export const TMDB_CREDITS_OK = {
  cast: [
    {
      name: 'Brad Pitt',
      character: 'Tyler Durden',
      profile_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      order: 0,
    },
    {
      name: 'Edward Norton',
      character: 'The Narrator',
      profile_path: null,
      order: 1,
    },
  ],
};
