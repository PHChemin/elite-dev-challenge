import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { CatalogService } from './catalog.service';
import { TmdbClient } from './tmdb/tmdb.client';
import { TmdbNotFoundError, TmdbUnavailableError } from './tmdb/tmdb.errors';

const fightClub = {
  id: 550,
  title: 'Clube da Luta',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  release_date: '1999-10-15',
};

const mappedFightClub = {
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  releaseDate: '1999-10-15',
  runtimeMinutes: null,
  overview: null,
  genres: [],
};

describe('CatalogService', () => {
  let service: CatalogService;
  const tmdb = {
    searchMovies: jest.fn(),
    getMovie: jest.fn(),
  };
  const i18n = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    tmdb.searchMovies.mockReset();
    tmdb.getMovie.mockReset();
    i18n.t.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: TmdbClient, useValue: tmdb },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(CatalogService);
  });

  it('returns title and poster for a valid search query', async () => {
    tmdb.searchMovies.mockResolvedValue([fightClub]);

    await expect(service.search('clube da luta')).resolves.toEqual({
      results: [mappedFightClub],
    });
    expect(tmdb.searchMovies).toHaveBeenCalledWith('clube da luta');
  });

  it('maps a missing poster to null', async () => {
    tmdb.searchMovies.mockResolvedValue([
      { ...fightClub, poster_path: null, release_date: '' },
    ]);

    await expect(service.search('clube')).resolves.toEqual({
      results: [{ ...mappedFightClub, posterUrl: null, releaseDate: null }],
    });
  });

  it('throws a clear error when TMDb search is unavailable', async () => {
    tmdb.searchMovies.mockRejectedValue(new TmdbUnavailableError());

    await expect(service.search('matrix')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(i18n.t).toHaveBeenCalledWith('catalog.tmdbUnavailable');
  });

  it('returns title and poster for a TMDb movie id', async () => {
    tmdb.getMovie.mockResolvedValue(fightClub);

    await expect(service.getMovie('550')).resolves.toEqual(mappedFightClub);
    expect(tmdb.getMovie).toHaveBeenCalledWith('550');
  });

  it('throws not found when TMDb has no movie for the id', async () => {
    tmdb.getMovie.mockRejectedValue(new TmdbNotFoundError());

    await expect(service.getMovie('0')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(i18n.t).toHaveBeenCalledWith('catalog.movieNotFound');
  });

  it('throws a clear error when TMDb details are unavailable', async () => {
    tmdb.getMovie.mockRejectedValue(new TmdbUnavailableError());

    await expect(service.getMovie('550')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(i18n.t).toHaveBeenCalledWith('catalog.tmdbUnavailable');
  });
});
