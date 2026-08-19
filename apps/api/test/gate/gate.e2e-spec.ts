import { INestApplication } from '@nestjs/common';
import { PublishStatus, Role, TicketKind } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SEED_USERS } from '../../prisma/seed-users';
import { addMs, nowUtc } from '../../src/common/dates';
import {
  createE2eApp,
  readLoginBody,
  type PrismaMock,
  type SeedEventRow,
  type SeedExhibitionRow,
} from '../helpers/e2e-app';

const now = nowUtc();
const TICKET_CODE = 'c'.repeat(32);
const OTHER_EVENT_CODE = 'd'.repeat(32);

const publishedExhibition: SeedExhibitionRow = {
  id: 'exhibition-pub',
  organizerId: 'user-organizer',
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: null,
  publishStatus: PublishStatus.published,
  runtimeMinutes: 139,
};

const otherExhibition: SeedExhibitionRow = {
  id: 'exhibition-other',
  organizerId: 'user-other-org',
  tmdbId: '551',
  title: 'Outro Filme',
  posterUrl: null,
  publishStatus: PublishStatus.published,
  runtimeMinutes: 120,
};

const activeEvent: SeedEventRow = {
  id: 'event-active',
  exhibitionId: publishedExhibition.id,
  startsAt: addMs(now, -30 * 60 * 1000),
  venueName: 'Cine PHC',
  venueAddress: 'Rua A, 100',
  priceFull: 4000,
  priceHalf: 2000,
  maxTicketsPerOrder: 6,
  publishStatus: PublishStatus.published,
};

const upcomingEvent: SeedEventRow = {
  id: 'event-upcoming',
  exhibitionId: publishedExhibition.id,
  startsAt: addMs(now, 24 * 60 * 60 * 1000),
  venueName: 'Cine PHC Sala 2',
  venueAddress: 'Rua A, 100',
  priceFull: 4000,
  priceHalf: 2000,
  maxTicketsPerOrder: 6,
  publishStatus: PublishStatus.published,
};

const endedEvent: SeedEventRow = {
  id: 'event-ended',
  exhibitionId: publishedExhibition.id,
  startsAt: addMs(now, -5 * 60 * 60 * 1000),
  venueName: 'Cine PHC Sala 3',
  venueAddress: 'Rua A, 100',
  priceFull: 4000,
  priceHalf: 2000,
  maxTicketsPerOrder: 6,
  publishStatus: PublishStatus.published,
};

const otherOrgEvent: SeedEventRow = {
  id: 'event-other-org',
  exhibitionId: otherExhibition.id,
  startsAt: addMs(now, 2 * 60 * 60 * 1000),
  venueName: 'Cine Outro',
  venueAddress: null,
  priceFull: 3000,
  priceHalf: 1500,
  maxTicketsPerOrder: 6,
  publishStatus: PublishStatus.published,
};

type GateEventsBody = {
  items: Array<{ id: string; saleState: string }>;
  page: number;
  pageSize: number;
  total: number;
};

type ScanBody = {
  status: string;
  seatLabel?: string;
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

async function seedTickets(prisma: PrismaMock) {
  const seats = await prisma.seat.findMany({ where: { eventId: activeEvent.id } });
  const seatA1 = seats.find((seat) => seat.label === 'A1');
  const otherSeats = await prisma.seat.findMany({
    where: { eventId: otherOrgEvent.id },
  });
  const otherSeat = otherSeats.find((seat) => seat.label === 'A1');
  if (!seatA1 || !otherSeat) {
    throw new Error('seed seats missing');
  }

  await prisma.ticket.create({
    data: {
      orderId: 'order-a',
      eventId: activeEvent.id,
      seatId: seatA1.id,
      customerId: 'user-customer',
      kind: TicketKind.full,
      code: TICKET_CODE,
      shareToken: 'share-customer-a1',
    },
  });
  await prisma.ticket.create({
    data: {
      orderId: 'order-b',
      eventId: otherOrgEvent.id,
      seatId: otherSeat.id,
      customerId: 'user-customer',
      kind: TicketKind.full,
      code: OTHER_EVENT_CODE,
      shareToken: 'share-other-a1',
    },
  });
}

describe('Gate (e2e)', () => {
  let app: INestApplication;
  let server: App;
  let prisma: PrismaMock;

  beforeAll(async () => {
    const setup = await createE2eApp({
      exhibitions: [publishedExhibition, otherExhibition],
      events: [activeEvent, upcomingEvent, endedEvent, otherOrgEvent],
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

  it('GET /api/gate/events lists active sessions for gate organizer', async () => {
    const token = await loginAs(server, Role.gate);
    const response = await request(server)
      .get('/api/gate/events')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as GateEventsBody;
    expect(body.total).toBe(2);
    expect(body.items.map((row) => row.id)).toEqual([
      activeEvent.id,
      upcomingEvent.id,
    ]);
    expect(body.items[0]?.saleState).toBe('in_progress');
  });

  it('GET /api/gate/events rejects customer role', async () => {
    const token = await loginAs(server, Role.customer);
    await request(server)
      .get('/api/gate/events')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /api/gate/scan returns valid for matching code and event', async () => {
    const token = await loginAs(server, Role.gate);
    const response = await request(server)
      .post('/api/gate/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: activeEvent.id, code: TICKET_CODE })
      .expect(200);

    const body = response.body as ScanBody;
    expect(body).toMatchObject({ status: 'valid', seatLabel: 'A1' });
  });

  it('POST /api/gate/scan returns already_used on second scan', async () => {
    const token = await loginAs(server, Role.gate);
    const response = await request(server)
      .post('/api/gate/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: activeEvent.id, code: TICKET_CODE })
      .expect(200);

    expect((response.body as ScanBody).status).toBe('already_used');
  });

  it('POST /api/gate/scan returns invalid for unknown code', async () => {
    const token = await loginAs(server, Role.gate);
    const response = await request(server)
      .post('/api/gate/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: activeEvent.id, code: 'z'.repeat(32) })
      .expect(200);

    expect((response.body as ScanBody).status).toBe('invalid');
  });

  it('POST /api/gate/scan returns wrong_event for another session code', async () => {
    const token = await loginAs(server, Role.gate);
    const response = await request(server)
      .post('/api/gate/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: activeEvent.id, code: OTHER_EVENT_CODE })
      .expect(200);

    expect((response.body as ScanBody).status).toBe('wrong_event');
  });

  it('POST /api/gate/scan rejects organizer role', async () => {
    const token = await loginAs(server, Role.organizer);
    await request(server)
      .post('/api/gate/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: activeEvent.id, code: OTHER_EVENT_CODE })
      .expect(403);
  });
});
