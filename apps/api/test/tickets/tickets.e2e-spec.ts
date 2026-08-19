import { INestApplication } from '@nestjs/common';
import { PublishStatus, Role, TicketKind } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SEED_USERS } from '../../prisma/seed-users';
import { toDate } from '../../src/common/dates';
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

type MineTicket = {
  id: string;
  code: string;
  shareToken: string;
  seatLabel: string;
  kind: string;
};

type ShareTicket = {
  code: string;
  seatLabel: string;
  kind: string;
  event: { venueName: string };
  exhibition: { title: string };
};

function readMine(body: unknown): MineTicket[] {
  return body as MineTicket[];
}

function readShare(body: unknown): ShareTicket {
  return body as ShareTicket;
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

async function seedTickets(prisma: PrismaMock) {
  const seats = await prisma.seat.findMany({ where: { eventId: publishedEvent.id } });
  const seatA1 = seats.find((seat) => seat.label === 'A1');
  const seatA2 = seats.find((seat) => seat.label === 'A2');
  const seatB1 = seats.find((seat) => seat.label === 'B1');
  if (!seatA1 || !seatA2 || !seatB1) {
    throw new Error('seed seats missing');
  }

  await prisma.ticket.create({
    data: {
      orderId: 'order-a',
      eventId: publishedEvent.id,
      seatId: seatA1.id,
      customerId: 'user-customer',
      kind: TicketKind.full,
      code: 'c'.repeat(32),
      shareToken: 'share-customer-a1',
    },
  });
  await prisma.ticket.create({
    data: {
      orderId: 'order-a',
      eventId: publishedEvent.id,
      seatId: seatA2.id,
      customerId: 'user-customer',
      kind: TicketKind.half,
      code: 'd'.repeat(32),
      shareToken: 'share-customer-a2',
    },
  });
  await prisma.ticket.create({
    data: {
      orderId: 'order-b',
      eventId: publishedEvent.id,
      seatId: seatB1.id,
      customerId: 'user-other',
      kind: TicketKind.full,
      code: 'e'.repeat(32),
      shareToken: 'share-other-b1',
    },
  });
}

describe('Tickets (e2e)', () => {
  let app: INestApplication;
  let server: App;
  let prisma: PrismaMock;

  beforeAll(async () => {
    const setup = await createE2eApp({
      exhibitions: [publishedExhibition],
      events: [publishedEvent],
      seedSeats: true,
    });
    app = setup.app;
    server = setup.server;
    prisma = setup.prisma;
    await seedTickets(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/tickets/mine lists only the owner tickets', async () => {
    const token = await loginAs(server, Role.customer);
    const response = await request(server)
      .get('/api/tickets/mine')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = readMine(response.body);
    expect(body).toHaveLength(2);
    expect(body.map((row) => row.id)).toEqual(
      expect.arrayContaining([expect.any(String), expect.any(String)]),
    );
    expect(body.every((row) => row.code.length === 32)).toBe(true);
    expect(body.some((row) => row.shareToken === 'share-customer-a1')).toBe(
      true,
    );
  });

  it('GET /api/tickets/share/:shareToken returns session, seat and qr payload', async () => {
    const response = await request(server)
      .get('/api/tickets/share/share-customer-a1')
      .expect(200);

    const body = readShare(response.body);
    expect(body).toMatchObject({
      code: 'c'.repeat(32),
      seatLabel: 'A1',
      kind: TicketKind.full,
      event: { venueName: 'Cine PHC' },
      exhibition: { title: 'Clube da Luta' },
    });
    expect(body).not.toHaveProperty('shareToken');
    expect(body).not.toHaveProperty('customerId');
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('id');
  });

  it('GET /api/tickets/share/:shareToken returns 404 for unknown token', async () => {
    await request(server).get('/api/tickets/share/missing-token').expect(404);
  });

  it('GET /api/tickets/mine excludes another customer ticket', async () => {
    const token = await loginAs(server, Role.customer);
    const response = await request(server)
      .get('/api/tickets/mine')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = readMine(response.body);
    expect(body.some((row) => row.shareToken === 'share-other-b1')).toBe(false);
  });

  it('GET /api/tickets/mine rejects missing auth', async () => {
    await request(server).get('/api/tickets/mine').expect(401);
  });

  it('GET /api/tickets/mine rejects organizer role', async () => {
    const token = await loginAs(server, Role.organizer);
    await request(server)
      .get('/api/tickets/mine')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
