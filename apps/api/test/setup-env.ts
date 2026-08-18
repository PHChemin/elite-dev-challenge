process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/phctickets_test';
process.env.JWT_SECRET ??= 'test-jwt-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN ??= '8h';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';
process.env.TMDB_API_KEY ??= 'test-tmdb-key';
process.env.PORT ??= '3000';
