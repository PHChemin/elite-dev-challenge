export class TmdbUnavailableError extends Error {
  constructor() {
    super('TMDb unavailable');
    this.name = 'TmdbUnavailableError';
  }
}

export class TmdbNotFoundError extends Error {
  constructor() {
    super('TMDb movie not found');
    this.name = 'TmdbNotFoundError';
  }
}
