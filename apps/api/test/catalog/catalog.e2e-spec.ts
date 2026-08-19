import { INestApplication } from '@nestjs/common';
import { PublishStatus, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SEED_USERS } from '../../prisma/seed-users';
import { toDate } from '../../src/common/dates';
import {
  createE2eApp,
  readLoginBody,
  type SeedEventRow,
  type SeedExhibitionRow,
} from '../helpers/e2e-app';
import { createTmdbAxiosMock } from '../helpers/tmdb-axios';

const savedExhibition: SeedExhibitionRow = {
  id: 'exhibition-1',
  organizerId: 'user-organizer',
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  publishStatus: PublishStatus.published,
};

const savedEvent: SeedEventRow = {
  id: 'event-saved',
  exhibitionId: savedExhibition.id,
  startsAt: toDate('2026-09-01T19:00:00.000Z'),
  venueName: 'Cine PHC',
  venueAddress: null,
  priceFull: 4000,
  priceHalf: 2000,
  maxTicketsPerOrder: 6,
  publishStatus: PublishStatus.published,
};

const mappedFightClub = {
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  releaseDate: '1999-10-15',
  runtimeMinutes: 139,
  overview: 'Um funcionário de escritório forma um clube de luta clandestino.',
  genres: [{ id: 18, name: 'Drama' }],
};

const mappedUpcoming = {
  tmdbId: '999',
  title: 'Filme Futuro',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  releaseDate: '2027-01-01',
  runtimeMinutes: null,
  overview: null,
  genres: [],
};

async function loginAs(server: App, role: Role): Promise<string> {
  const seed = SEED_USERS.find((user) => user.role === role);
  if (!seed) {
    throw new Error(`${role} seed missing`);
  }
  const login = await request(server)
    .post('/api/auth/login')
    .send({ email: seed.email, password: seed.password })
    .expect(200);
  return readLoginBody(login.body).accessToken;
}

describe('Catalog (e2e)', () => {
  describe('TMDb available', () => {
    let app: INestApplication;
    let server: App;

    beforeAll(async () => {
      const created = await createE2eApp({
        exhibitions: [savedExhibition],
        events: [savedEvent],
      });
      app = created.app;
      server = created.server;
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /api/catalog/movies returns title and poster for an organizer', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .get('/api/catalog/movies')
        .query({ q: 'clube da luta' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({ results: [mappedFightClub] });
    });

    it('GET /api/catalog/movies rejects a customer token with 403', async () => {
      const accessToken = await loginAs(server, Role.customer);

      const response = await request(server)
        .get('/api/catalog/movies')
        .query({ q: 'clube da luta' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        path: '/api/catalog/movies',
        fieldErrors: {},
      });
    });

    it('GET /api/catalog/movies rejects a missing query with 400', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .get('/api/catalog/movies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        path: '/api/catalog/movies',
        message: 'Dados inválidos',
        fieldErrors: {
          q: ['Informe o termo de busca'],
        },
      });
    });

    it('GET /api/catalog/upcoming returns upcoming movies without auth', async () => {
      const response = await request(server)
        .get('/api/catalog/upcoming')
        .expect(200);

      expect(response.body).toEqual({
        results: [mappedUpcoming],
        page: 1,
        totalPages: 1,
      });
    });

    it('GET /api/catalog/movies/:tmdbId/credits returns cast without auth', async () => {
      const response = await request(server)
        .get('/api/catalog/movies/550/credits')
        .expect(200);

      expect(response.body.cast).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Brad Pitt',
            character: 'Tyler Durden',
          }),
        ]),
      );
      expect(response.body.cast).toHaveLength(2);
    });
  });

  describe('TMDb unavailable', () => {
    let app: INestApplication;
    let server: App;

    beforeAll(async () => {
      const created = await createE2eApp({
        exhibitions: [savedExhibition],
        events: [savedEvent],
        tmdbAxios: createTmdbAxiosMock({ unreachable: true }),
      });
      app = created.app;
      server = created.server;
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /api/catalog/movies returns a clear error when TMDb is down', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .get('/api/catalog/movies')
        .query({ q: 'matrix' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(502);

      expect(response.body).toMatchObject({
        statusCode: 502,
        path: '/api/catalog/movies',
        message: 'Catálogo TMDb indisponível',
        fieldErrors: {},
      });
    });

    it('GET /api/exhibitions still lists saved exhibitions when TMDb is down', async () => {
      const response = await request(server)
        .get('/api/exhibitions')
        .expect(200);

      expect(response.body).toMatchObject({
        items: [
          {
            id: savedExhibition.id,
            title: savedExhibition.title,
            posterUrl: savedExhibition.posterUrl,
            nextStartsAt: '2026-09-01T19:00:00.000Z',
            eventCount: 1,
          },
        ],
      });
    });

    it('GET /api/catalog/upcoming returns an empty list when TMDb is down', async () => {
      const response = await request(server)
        .get('/api/catalog/upcoming')
        .expect(200);

      expect(response.body).toEqual({
        results: [],
        page: 1,
        totalPages: 0,
      });
    });
  });
});
