import { INestApplication } from '@nestjs/common';
import { PublishStatus, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SEED_USERS } from '../../prisma/seed-users';
import { toDate, toIsoString } from '../../src/common/dates';
import { SEAT_LABELS } from '../../src/events/events.constants';
import {
  createE2eApp,
  readLoginBody,
  type PrismaMock,
  type SeedEventRow,
  type SeedExhibitionRow,
} from '../helpers/e2e-app';

const STARTS_AT = '2026-09-01T19:00:00.000Z';
const LATE_STARTS_AT = '2026-09-01T22:00:00.000Z';
const NEXT_MONTH = '2026-10-01T19:00:00.000Z';

const publishedExhibition: SeedExhibitionRow = {
  id: 'exhibition-pub',
  organizerId: 'user-organizer',
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  publishStatus: PublishStatus.published,
};

const draftExhibition: SeedExhibitionRow = {
  ...publishedExhibition,
  id: 'exhibition-draft',
  tmdbId: '603',
  title: 'Matrix',
  publishStatus: PublishStatus.draft,
};

const otherExhibition: SeedExhibitionRow = {
  ...publishedExhibition,
  id: 'exhibition-other',
  organizerId: 'user-admin',
  tmdbId: '13',
  title: 'Forrest Gump',
};

const publishedEvent: SeedEventRow = {
  id: 'event-pub',
  exhibitionId: publishedExhibition.id,
  startsAt: toDate(STARTS_AT),
  venueName: 'Cine PHC',
  venueAddress: 'Rua A, 100',
  priceFull: 4000,
  priceHalf: 2000,
  maxTicketsPerOrder: 6,
  publishStatus: PublishStatus.published,
};

const draftEvent: SeedEventRow = {
  ...publishedEvent,
  id: 'event-draft',
  exhibitionId: publishedExhibition.id,
  startsAt: toDate(LATE_STARTS_AT),
  publishStatus: PublishStatus.draft,
};

const validEvent = {
  startsAt: NEXT_MONTH,
  venueName: 'Cine PHC',
  venueAddress: 'Rua A, 100',
  priceFull: 4000,
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

function readIds(body: unknown): string[] {
  return (body as { id: string }[]).map((row) => row.id);
}

function readPublicEvents(body: unknown): { id: string }[] {
  return (body as { events: { id: string }[] }).events;
}

function readCreatedEvents(body: unknown): { id: string }[] {
  return body as { id: string }[];
}

describe('Exhibitions (e2e)', () => {
  let app: INestApplication;
  let server: App;
  let prisma: PrismaMock;

  beforeEach(async () => {
    const created = await createE2eApp({
      exhibitions: [
        { ...publishedExhibition },
        { ...draftExhibition },
        { ...otherExhibition },
      ],
      events: [{ ...publishedEvent }, { ...draftEvent }],
    });
    app = created.app;
    server = created.server;
    prisma = created.prisma;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/events', () => {
    it('does not expose a public event list', async () => {
      await request(server).get('/api/events').expect(404);
    });
  });

  describe('GET /api/exhibitions/mine', () => {
    it('lists the organizer exhibitions including drafts', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .get('/api/exhibitions/mine')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const ids = readIds(response.body);
      expect(ids).toEqual(
        expect.arrayContaining([publishedExhibition.id, draftExhibition.id]),
      );
      expect(ids).not.toContain(otherExhibition.id);
    });
  });

  describe('GET /api/exhibitions', () => {
    it('lists published exhibitions without a token, including those without extra events', async () => {
      const response = await request(server)
        .get('/api/exhibitions')
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          {
            id: publishedExhibition.id,
            title: publishedExhibition.title,
            posterUrl: publishedExhibition.posterUrl,
            nextStartsAt: toIsoString(publishedEvent.startsAt),
            eventCount: 1,
          },
          {
            id: otherExhibition.id,
            title: otherExhibition.title,
            posterUrl: otherExhibition.posterUrl,
            nextStartsAt: null,
            eventCount: 0,
          },
        ]),
      );
      expect(readIds(response.body)).not.toContain(draftExhibition.id);
    });
  });

  describe('GET /api/exhibitions/:id', () => {
    it('returns the published exhibition with published events only', async () => {
      const response = await request(server)
        .get(`/api/exhibitions/${publishedExhibition.id}`)
        .expect(200);

      expect(readPublicEvents(response.body).map((row) => row.id)).toEqual([
        publishedEvent.id,
      ]);
    });

    it('hides a draft exhibition with 404', async () => {
      const response = await request(server)
        .get(`/api/exhibitions/${draftExhibition.id}`)
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Cartaz não encontrado',
      });
    });
  });

  describe('POST /api/exhibitions', () => {
    it('creates a draft exhibition from TMDb', async () => {
      await app.close();
      const created = await createE2eApp({
        exhibitions: [{ ...draftExhibition }],
      });
      app = created.app;
      server = created.server;
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .post('/api/exhibitions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tmdbId: '550' })
        .expect(201);

      expect(response.body).toMatchObject({
        tmdbId: '550',
        title: 'Clube da Luta',
        publishStatus: PublishStatus.draft,
      });
    });

    it('rejects a second exhibition for the same movie with 409', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .post('/api/exhibitions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tmdbId: '550' })
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'Este filme já tem um cartaz',
      });
    });

    it('rejects a customer token with 403', async () => {
      const accessToken = await loginAs(server, Role.customer);

      const response = await request(server)
        .post('/api/exhibitions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tmdbId: '550' })
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        path: '/api/exhibitions',
        message: 'Papel insuficiente',
      });
    });
  });

  describe('PATCH /api/exhibitions/:id', () => {
    it('publishes the exhibition', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .patch(`/api/exhibitions/${draftExhibition.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ publishStatus: PublishStatus.published })
        .expect(200);

      expect(response.body).toMatchObject({
        id: draftExhibition.id,
        publishStatus: PublishStatus.published,
      });
    });

    it('rejects changing the movie when the exhibition has events', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .patch(`/api/exhibitions/${publishedExhibition.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tmdbId: '13' })
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'Não é possível trocar o filme de um cartaz com eventos',
      });
    });
  });

  describe('POST /api/exhibitions/:id/events', () => {
    it('creates an event with priceHalf as half of priceFull and generates the seats', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .post(`/api/exhibitions/${draftExhibition.id}/events`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ events: [{ ...validEvent, priceFull: 4001 }] })
        .expect(201);

      const created = readCreatedEvents(response.body);
      expect(created).toHaveLength(1);
      expect(created[0]).toMatchObject({
        venueName: 'Cine PHC',
        priceFull: 4001,
        priceHalf: 2000,
        maxTicketsPerOrder: 6,
        publishStatus: PublishStatus.published,
      });
      expect(prisma.seat.count({ where: { eventId: created[0].id } })).toBe(
        SEAT_LABELS.length,
      );
    });

    it('creates two events at the same time in different venues', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .post(`/api/exhibitions/${draftExhibition.id}/events`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          events: [
            { ...validEvent, venueName: 'Cine PHC' },
            { ...validEvent, venueName: 'Cine Centro' },
          ],
        })
        .expect(201);

      expect(response.body).toHaveLength(2);
    });

    it('rejects the same time at the same venue with 409', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .post(`/api/exhibitions/${draftExhibition.id}/events`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          events: [
            { ...validEvent, venueName: 'Cine PHC' },
            { ...validEvent, venueName: 'Cine PHC', priceFull: 3500 },
          ],
        })
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'Já existe evento neste horário e local',
      });
    });

    it('rejects an event that already exists in the exhibition with 409', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .post(`/api/exhibitions/${publishedExhibition.id}/events`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          events: [
            {
              startsAt: toIsoString(publishedEvent.startsAt),
              venueName: publishedEvent.venueName,
              priceFull: 4000,
            },
          ],
        })
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'Já existe evento neste horário e local',
      });
    });

    it('rejects a customer token with 403', async () => {
      const accessToken = await loginAs(server, Role.customer);

      await request(server)
        .post(`/api/exhibitions/${draftExhibition.id}/events`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ events: [validEvent] })
        .expect(403);
    });

    it('rejects an empty events list with 400', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .post(`/api/exhibitions/${draftExhibition.id}/events`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ events: [] })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        fieldErrors: {
          events: ['Informe de 1 a 62 eventos'],
        },
      });
    });
  });

  describe('PATCH /api/events/:id', () => {
    it('edits the venue of the event', async () => {
      const accessToken = await loginAs(server, Role.organizer);

      const response = await request(server)
        .patch(`/api/events/${draftEvent.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ venueName: 'Cine Centro' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: draftEvent.id,
        venueName: 'Cine Centro',
      });
    });

    it('rejects an event of another organizer with 403', async () => {
      const otherEvent: SeedEventRow = {
        ...publishedEvent,
        id: 'event-other',
        exhibitionId: otherExhibition.id,
      };
      await app.close();
      const created = await createE2eApp({
        exhibitions: [{ ...publishedExhibition }, { ...otherExhibition }],
        events: [{ ...otherEvent }],
      });
      app = created.app;
      server = created.server;
      const token = await loginAs(server, Role.organizer);

      const response = await request(server)
        .patch(`/api/events/${otherEvent.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ venueName: 'Cine Centro' })
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        message: 'Evento de outro organizador',
      });
    });
  });
});
