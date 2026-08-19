import { INestApplication } from '@nestjs/common';
import {
  HoldStatus,
  PaymentStatus,
  PublishStatus,
  Role,
  TicketKind,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SEED_USERS } from '../../prisma/seed-users';
import { addMs, nowUtc, toDate } from '../../src/common/dates';
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

type HoldBody = {
  id: string;
};

type OrderBody = {
  id: string;
  holdId: string;
  paymentStatus: string;
  totalCents: number;
  paidAt: string | null;
  tickets: { id: string; seatLabel: string; kind: string }[];
};

type SeatMapBody = {
  myHold: { id: string } | null;
  seats: { label: string; status: string }[];
};

function readHold(body: unknown): HoldBody {
  return body as HoldBody;
}

function readOrder(body: unknown): OrderBody {
  return body as OrderBody;
}

function readSeatMap(body: unknown): SeatMapBody {
  return body as SeatMapBody;
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

async function createHold(
  server: App,
  token: string,
  seats: string[] = ['A1', 'A2'],
  fullCount = 1,
  halfCount = 1,
): Promise<string> {
  const response = await request(server)
    .post('/api/reservations/holds')
    .set('Authorization', `Bearer ${token}`)
    .send({
      eventId: publishedEvent.id,
      seatLabels: seats,
      fullCount,
      halfCount,
    })
    .expect(201);
  return readHold(response.body).id;
}

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let server: App;
  let prisma: PrismaMock;

  beforeEach(async () => {
    const created = await createE2eApp({
      exhibitions: [{ ...publishedExhibition }],
      events: [{ ...publishedEvent }],
      seedSeats: true,
    });
    app = created.app;
    server = created.server;
    prisma = created.prisma;
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/orders/pay approved gera um ticket por assento', async () => {
    const token = await loginAs(server, Role.customer);
    const holdId = await createHold(server, token);

    const response = await request(server)
      .post('/api/orders/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ holdId, result: PaymentStatus.approved })
      .expect(201);

    const body = readOrder(response.body);
    expect(body).toMatchObject({
      holdId,
      paymentStatus: PaymentStatus.approved,
      totalCents: 6000,
    });
    expect(body.paidAt).toEqual(expect.any(String));
    expect(body.tickets).toHaveLength(2);
    expect(body.tickets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ seatLabel: 'A1', kind: TicketKind.full }),
        expect.objectContaining({ seatLabel: 'A2', kind: TicketKind.half }),
      ]),
    );

    const map = await request(server)
      .get(`/api/events/${publishedEvent.id}/seats`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const seats = readSeatMap(map.body);
    expect(seats.myHold).toBeNull();
    expect(
      seats.seats.filter(
        (seat) =>
          (seat.label === 'A1' || seat.label === 'A2') &&
          seat.status === 'taken',
      ),
    ).toHaveLength(2);

    await request(server)
      .get(`/api/reservations/holds/${holdId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /api/orders/pay declined não vende e libera o lugar', async () => {
    const token = await loginAs(server, Role.customer);
    const holdId = await createHold(server, token);

    const response = await request(server)
      .post('/api/orders/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ holdId, result: PaymentStatus.declined })
      .expect(201);

    const body = readOrder(response.body);
    expect(body).toMatchObject({
      holdId,
      paymentStatus: PaymentStatus.declined,
      paidAt: null,
      tickets: [],
    });

    const map = await request(server)
      .get(`/api/events/${publishedEvent.id}/seats`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const seats = readSeatMap(map.body);
    expect(
      seats.seats.filter(
        (seat) =>
          (seat.label === 'A1' || seat.label === 'A2') &&
          seat.status === 'free',
      ),
    ).toHaveLength(2);

    await request(server)
      .get(`/api/reservations/holds/${holdId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /api/orders/pay rejects an expired hold', async () => {
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
        customerId: 'user-customer',
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
      .post('/api/orders/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ holdId: hold.id, result: PaymentStatus.approved })
      .expect(404);
  });

  it('POST /api/orders/pay rejects a hold that belongs to another customer', async () => {
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
      .post('/api/orders/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ holdId: hold.id, result: PaymentStatus.approved })
      .expect(403);
  });

  it('POST /api/orders/pay conflicts on a second approved for the same hold', async () => {
    const token = await loginAs(server, Role.customer);
    const holdId = await createHold(server, token, ['B1'], 1, 0);

    await request(server)
      .post('/api/orders/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ holdId, result: PaymentStatus.approved })
      .expect(201);

    await request(server)
      .post('/api/orders/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ holdId, result: PaymentStatus.approved })
      .expect(409);
  });

  it('POST /api/orders/pay rejects a non-customer', async () => {
    const token = await loginAs(server, Role.organizer);
    await request(server)
      .post('/api/orders/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ holdId: 'hold-1', result: PaymentStatus.approved })
      .expect(403);
  });
});
