import { INestApplication } from '@nestjs/common';
import { HoldStatus, PublishStatus, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SEED_USERS } from '../../prisma/seed-users';
import { addMs, nowUtc, toDate } from '../../src/common/dates';
import { SEAT_LABELS } from '../../src/events/events.constants';
import { HOLD_TTL_MS } from '../../src/reservations/reservations.constants';
import {
  createE2eApp,
  readLoginBody,
  type PrismaMock,
  type SeedEventRow,
  type SeedExhibitionRow,
} from '../helpers/e2e-app';

const STARTS_AT = '2026-09-01T19:00:00.000Z';

const publishedExhibition: SeedExhibitionRow = {
  id: 'exhibition-pub',
  organizerId: 'user-organizer',
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: null,
  publishStatus: PublishStatus.published,
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
  publishStatus: PublishStatus.draft,
  startsAt: toDate('2026-09-01T22:00:00.000Z'),
};

const pastEvent: SeedEventRow = {
  ...publishedEvent,
  id: 'event-past',
  startsAt: toDate('2026-08-01T15:00:00.000Z'),
  venueName: 'Sala 3 - Cine PHC',
};

type EventDetailBody = {
  id: string;
  venueName: string;
  priceFull: number;
  maxTicketsPerOrder: number;
  freeSeatCount: number;
  exhibition: { id: string; title: string };
};

type SeatMapBody = {
  myHold: { id: string; expiresAt: string } | null;
  seats: { label: string; status: string }[];
};

type HoldBody = {
  id: string;
  eventId: string;
  fullCount: number;
  halfCount: number;
  expiresAt: string;
  seatLabels: string[];
};

type ErrorBody = {
  message: string;
};

function readEventDetail(body: unknown): EventDetailBody {
  return body as EventDetailBody;
}

function readSeatMap(body: unknown): SeatMapBody {
  return body as SeatMapBody;
}

function readHold(body: unknown): HoldBody {
  return body as HoldBody;
}

function readError(body: unknown): ErrorBody {
  return body as ErrorBody;
}

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

describe('Reservations (e2e)', () => {
  let app: INestApplication;
  let server: App;
  let prisma: PrismaMock;

  beforeEach(async () => {
    const created = await createE2eApp({
      exhibitions: [{ ...publishedExhibition }],
      events: [{ ...publishedEvent }, { ...draftEvent }, { ...pastEvent }],
      seedSeats: true,
    });
    app = created.app;
    server = created.server;
    prisma = created.prisma;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/events/:id returns freeSeatCount for a published event', async () => {
    const response = await request(server)
      .get(`/api/events/${publishedEvent.id}`)
      .expect(200);

    const body = readEventDetail(response.body);
    expect(body).toMatchObject({
      id: publishedEvent.id,
      venueName: 'Cine PHC',
      priceFull: 4000,
      maxTicketsPerOrder: 6,
      freeSeatCount: SEAT_LABELS.length,
      exhibition: { id: publishedExhibition.id, title: 'Clube da Luta' },
    });
  });

  it('GET /api/events/:id returns 404 for a draft event', async () => {
    await request(server).get(`/api/events/${draftEvent.id}`).expect(404);
  });

  it('GET /api/events/:id/seats rejects an anonymous caller', async () => {
    await request(server)
      .get(`/api/events/${publishedEvent.id}/seats`)
      .expect(401);
  });

  it('GET /api/events/:id/seats rejects a non-customer', async () => {
    const token = await loginAs(server, Role.organizer);
    await request(server)
      .get(`/api/events/${publishedEvent.id}/seats`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('GET /api/events/:id/seats lists every seat as free', async () => {
    const token = await loginAs(server, Role.customer);
    const response = await request(server)
      .get(`/api/events/${publishedEvent.id}/seats`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = readSeatMap(response.body);
    expect(body.myHold).toBeNull();
    expect(body.seats).toHaveLength(SEAT_LABELS.length);
    expect(body.seats[0]).toEqual({ label: 'A1', status: 'free' });
  });

  it('POST /api/reservations/holds keeps N seats when N matches fullCount + halfCount', async () => {
    const token = await loginAs(server, Role.customer);
    const response = await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: publishedEvent.id,
        seatLabels: ['A1', 'A2'],
        fullCount: 1,
        halfCount: 1,
      })
      .expect(201);

    const body = readHold(response.body);
    expect(body).toMatchObject({
      eventId: publishedEvent.id,
      fullCount: 1,
      halfCount: 1,
      seatLabels: ['A1', 'A2'],
    });
    expect(body.expiresAt).toEqual(expect.any(String));

    const map = await request(server)
      .get(`/api/events/${publishedEvent.id}/seats`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const seats = readSeatMap(map.body);
    expect(seats.myHold?.id).toBe(body.id);
    expect(
      seats.seats.filter((seat) => seat.status === 'held_by_me'),
    ).toHaveLength(2);
  });

  it('POST /api/reservations/holds rejects a quantity above the event cap', async () => {
    const token = await loginAs(server, Role.customer);
    const response = await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: publishedEvent.id,
        seatLabels: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
        fullCount: 7,
        halfCount: 0,
      })
      .expect(400);

    expect(readError(response.body).message).toBeDefined();
  });

  it('POST /api/reservations/holds rejects a quantity above the free seats', async () => {
    const seats = await prisma.seat.findMany({
      where: { eventId: publishedEvent.id },
    });
    await prisma.ticket.createMany({
      data: seats
        .filter(
          (seat: { label: string }) =>
            !['A1', 'A2', 'A3', 'A4', 'A5'].includes(seat.label),
        )
        .map((seat: { id: string }) => ({
          seatId: seat.id,
          cancelledAt: null,
        })),
    });

    const token = await loginAs(server, Role.customer);
    const response = await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: publishedEvent.id,
        seatLabels: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
        fullCount: 6,
        halfCount: 0,
      })
      .expect(409);

    expect(readError(response.body).message).toContain('5');
  });

  it('POST /api/reservations/holds conflicts when the seat is already held', async () => {
    const seats = await prisma.seat.findMany({
      where: { eventId: publishedEvent.id },
    });
    const a1 = seats.find(
      (seat: { id: string; label: string }) => seat.label === 'A1',
    );
    if (!a1) {
      throw new Error('A1 missing');
    }
    const hold = await prisma.hold.create({
      data: {
        customerId: 'user-organizer',
        eventId: publishedEvent.id,
        fullCount: 1,
        halfCount: 0,
        expiresAt: addMs(nowUtc(), HOLD_TTL_MS),
      },
    });
    await prisma.holdSeat.createMany({
      data: [{ holdId: hold.id, seatId: a1.id }],
    });

    const token = await loginAs(server, Role.customer);
    await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: publishedEvent.id,
        seatLabels: ['A1'],
        fullCount: 1,
        halfCount: 0,
      })
      .expect(409);
  });

  it('POST /api/reservations/holds reuses seats after the previous hold expired', async () => {
    const seats = await prisma.seat.findMany({
      where: { eventId: publishedEvent.id },
    });
    const a1 = seats.find(
      (seat: { id: string; label: string }) => seat.label === 'A1',
    );
    if (!a1) {
      throw new Error('A1 missing');
    }
    const hold = await prisma.hold.create({
      data: {
        customerId: 'user-organizer',
        eventId: publishedEvent.id,
        fullCount: 1,
        halfCount: 0,
        expiresAt: addMs(nowUtc(), -1000),
        holdStatus: HoldStatus.active,
      },
    });
    await prisma.holdSeat.createMany({
      data: [{ holdId: hold.id, seatId: a1.id }],
    });

    const token = await loginAs(server, Role.customer);
    await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: publishedEvent.id,
        seatLabels: ['A1'],
        fullCount: 1,
        halfCount: 0,
      })
      .expect(201);
  });

  it('GET /api/reservations/holds/:id returns the owner active hold', async () => {
    const token = await loginAs(server, Role.customer);
    const created = await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: publishedEvent.id,
        seatLabels: ['B1'],
        fullCount: 1,
        halfCount: 0,
      })
      .expect(201);

    const createdHold = readHold(created.body);
    const response = await request(server)
      .get(`/api/reservations/holds/${createdHold.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = readHold(response.body);
    expect(body.id).toBe(createdHold.id);
    expect(body.seatLabels).toEqual(['B1']);
  });

  it('POST /api/reservations/holds rejects an event that already started', async () => {
    const token = await loginAs(server, Role.customer);
    const response = await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: pastEvent.id,
        seatLabels: ['A1'],
        fullCount: 1,
        halfCount: 0,
      })
      .expect(400);

    expect(readError(response.body).message).toBeDefined();
  });

  it('POST /api/reservations/holds rejects a non-customer', async () => {
    const token = await loginAs(server, Role.organizer);
    await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: publishedEvent.id,
        seatLabels: ['A1'],
        fullCount: 1,
        halfCount: 0,
      })
      .expect(403);
  });

  it('GET /api/reservations/holds/mine lists the active pending hold', async () => {
    const token = await loginAs(server, Role.customer);
    const hold = await request(server)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: publishedEvent.id,
        seatLabels: ['A1', 'A2'],
        fullCount: 1,
        halfCount: 1,
      })
      .expect(201);

    const response = await request(server)
      .get('/api/reservations/holds/mine')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as { id: string; expiresAt: string }[];
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe((hold.body as { id: string }).id);
    expect(body[0].expiresAt).toEqual(expect.any(String));
  });
});
