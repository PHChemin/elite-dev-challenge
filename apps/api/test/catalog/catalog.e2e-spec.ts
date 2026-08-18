import { INestApplication } from '@nestjs/common';
import { PublishStatus, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SEED_USERS } from '../../prisma/seed-users';
import { createE2eApp, readLoginBody, SeedEventRow } from '../helpers/e2e-app';
import { createTmdbAxiosMock } from '../helpers/tmdb-axios';

const savedSession: SeedEventRow = {
  id: 'event-1',
  organizerId: 'user-organizer',
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  startsAt: new Date('2026-09-01T19:00:00.000Z'),
  venueName: 'Cine PHC',
  venueAddress: 'Rua A, 100',
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
      const created = await createE2eApp({ events: [savedSession] });
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
  });

  describe('TMDb unavailable', () => {
    let app: INestApplication;
    let server: App;

    beforeAll(async () => {
      const created = await createE2eApp({
        events: [savedSession],
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

    it('GET /api/events still lists saved sessions when TMDb is down', async () => {
      const response = await request(server).get('/api/events').expect(200);

      expect(response.body).toEqual([
        {
          id: savedSession.id,
          title: savedSession.title,
          posterUrl: savedSession.posterUrl,
          startsAt: savedSession.startsAt.toISOString(),
          venueName: savedSession.venueName,
          venueAddress: savedSession.venueAddress,
          priceFull: savedSession.priceFull,
          priceHalf: savedSession.priceHalf,
          maxTicketsPerOrder: savedSession.maxTicketsPerOrder,
        },
      ]);
    });
  });
});
