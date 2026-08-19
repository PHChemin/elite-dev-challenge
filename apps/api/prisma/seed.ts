import {
  HoldStatus,
  PaymentStatus,
  PrismaClient,
  PublishStatus,
  Role,
  TicketKind,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { SEAT_LABELS } from './seed.constants';
import { SEED_DEMO, SEED_USERS } from './seed-users';

const prisma = new PrismaClient();

async function upsertUser(
  email: string,
  password: string,
  role: Role,
  organizerId?: string,
) {
  const passwordHash = await hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      status: 'active',
      organizerId: organizerId ?? null,
    },
    create: {
      email,
      passwordHash,
      role,
      organizerId,
    },
  });
}

async function seedDemoSession(organizerId: string, customerId: string) {
  await prisma.exhibition.upsert({
    where: { id: SEED_DEMO.exhibitionId },
    update: {
      organizerId,
      tmdbId: '550',
      title: 'Clube da Luta',
      posterUrl: null,
      runtimeMinutes: 139,
      overview: 'Um homem insone conhece um vendedor de sabonetes.',
      publishStatus: PublishStatus.published,
    },
    create: {
      id: SEED_DEMO.exhibitionId,
      organizerId,
      tmdbId: '550',
      title: 'Clube da Luta',
      posterUrl: null,
      runtimeMinutes: 139,
      overview: 'Um homem insone conhece um vendedor de sabonetes.',
      publishStatus: PublishStatus.published,
    },
  });

  await prisma.event.upsert({
    where: { id: SEED_DEMO.eventId },
    update: {
      exhibitionId: SEED_DEMO.exhibitionId,
      startsAt: new Date(SEED_DEMO.startsAt),
      venueName: SEED_DEMO.venueName,
      venueAddress: 'Rua Demo, 100 — São Paulo',
      priceFull: 4000,
      priceHalf: 2000,
      maxTicketsPerOrder: 6,
      publishStatus: PublishStatus.published,
    },
    create: {
      id: SEED_DEMO.eventId,
      exhibitionId: SEED_DEMO.exhibitionId,
      startsAt: new Date(SEED_DEMO.startsAt),
      venueName: SEED_DEMO.venueName,
      venueAddress: 'Rua Demo, 100 — São Paulo',
      priceFull: 4000,
      priceHalf: 2000,
      maxTicketsPerOrder: 6,
      publishStatus: PublishStatus.published,
    },
  });

  for (const label of SEAT_LABELS) {
    await prisma.seat.upsert({
      where: {
        eventId_label: {
          eventId: SEED_DEMO.eventId,
          label,
        },
      },
      update: {},
      create: {
        eventId: SEED_DEMO.eventId,
        label,
        ...(label === 'A1' ? { id: SEED_DEMO.seatA1Id } : {}),
      },
    });
  }

  const seatA1 = await prisma.seat.findUniqueOrThrow({
    where: {
      eventId_label: {
        eventId: SEED_DEMO.eventId,
        label: 'A1',
      },
    },
  });

  await prisma.hold.upsert({
    where: { id: SEED_DEMO.holdId },
    update: {
      customerId,
      eventId: SEED_DEMO.eventId,
      fullCount: 1,
      halfCount: 0,
      expiresAt: new Date(SEED_DEMO.startsAt),
      holdStatus: HoldStatus.converted,
    },
    create: {
      id: SEED_DEMO.holdId,
      customerId,
      eventId: SEED_DEMO.eventId,
      fullCount: 1,
      halfCount: 0,
      expiresAt: new Date(SEED_DEMO.startsAt),
      holdStatus: HoldStatus.converted,
    },
  });

  await prisma.order.upsert({
    where: { id: SEED_DEMO.orderId },
    update: {
      customerId,
      holdId: SEED_DEMO.holdId,
      paymentStatus: PaymentStatus.approved,
      totalCents: 4000,
      paidAt: new Date('2026-08-01T12:00:00.000Z'),
    },
    create: {
      id: SEED_DEMO.orderId,
      customerId,
      holdId: SEED_DEMO.holdId,
      paymentStatus: PaymentStatus.approved,
      totalCents: 4000,
      paidAt: new Date('2026-08-01T12:00:00.000Z'),
    },
  });

  await prisma.ticket.upsert({
    where: { id: SEED_DEMO.ticketId },
    update: {
      orderId: SEED_DEMO.orderId,
      eventId: SEED_DEMO.eventId,
      seatId: seatA1.id,
      customerId,
      kind: TicketKind.full,
      code: SEED_DEMO.ticketCode,
      shareToken: SEED_DEMO.shareToken,
      usedAt: null,
      validatedByUserId: null,
      cancelledAt: null,
    },
    create: {
      id: SEED_DEMO.ticketId,
      orderId: SEED_DEMO.orderId,
      eventId: SEED_DEMO.eventId,
      seatId: seatA1.id,
      customerId,
      kind: TicketKind.full,
      code: SEED_DEMO.ticketCode,
      shareToken: SEED_DEMO.shareToken,
    },
  });
}

async function main() {
  const organizerSeed = SEED_USERS.find((user) => user.role === Role.organizer);
  const customerSeed = SEED_USERS.find(
    (user) => user.email === 'customer@phctickets.local',
  );
  if (!organizerSeed || !customerSeed) {
    throw new Error('Seed do organizador ou consumidor ausente');
  }

  const organizer = await upsertUser(
    organizerSeed.email,
    organizerSeed.password,
    Role.organizer,
  );

  let customerId = '';
  for (const seed of SEED_USERS) {
    if (seed.role === Role.organizer) {
      continue;
    }
    const user = await upsertUser(
      seed.email,
      seed.password,
      seed.role,
      seed.role === Role.gate ? organizer.id : undefined,
    );
    if (seed.email === customerSeed.email) {
      customerId = user.id;
    }
  }

  await seedDemoSession(organizer.id, customerId);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
