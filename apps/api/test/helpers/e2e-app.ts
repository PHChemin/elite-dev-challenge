import { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  Prisma,
  PublishStatus,
  Role,
  UserStatus,
  HoldStatus,
  PaymentStatus,
  TicketKind,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { App } from 'supertest/types';
import { TMDB_AXIOS } from '../../src/catalog/tmdb/tmdb.constants';
import { AppModule } from '../../src/app.module';
import { setupApp } from '../../src/common/setup-app';
import { SEAT_LABELS } from '../../src/events/events.constants';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SEED_USERS } from '../../prisma/seed-users';
import { createTmdbAxiosMock, type TmdbAxiosMock } from './tmdb-axios';

export type SeedUserRow = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  organizerId: string | null;
  mustChangePassword: boolean;
};

export type SeedExhibitionRow = {
  id: string;
  organizerId: string;
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  publishStatus: PublishStatus;
};

export type SeedEventRow = {
  id: string;
  exhibitionId: string;
  startsAt: Date;
  venueName: string;
  venueAddress: string | null;
  priceFull: number;
  priceHalf: number;
  maxTicketsPerOrder: number;
  publishStatus: PublishStatus;
};

export type SeedSeatRow = {
  id: string;
  eventId: string;
  label: string;
};

export type SeedHoldRow = {
  id: string;
  customerId: string;
  eventId: string;
  fullCount: number;
  halfCount: number;
  expiresAt: Date;
  holdStatus: HoldStatus;
};

export type SeedHoldSeatRow = {
  holdId: string;
  seatId: string;
};

export type SeedTicketRow = {
  id: string;
  seatId: string;
  cancelledAt: Date | null;
  orderId?: string;
  eventId?: string;
  customerId?: string;
  kind?: TicketKind;
  code?: string;
  shareToken?: string;
};

export type SeedOrderRow = {
  id: string;
  customerId: string;
  holdId: string;
  paymentStatus: PaymentStatus;
  totalCents: number;
  paidAt: Date | null;
};

export type LoginBody = {
  accessToken: string;
  user: { id: string; email: string; role: Role };
};

export type ProfileBody = {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  organizerId: string | null;
  mustChangePassword: boolean;
};

type UserWhere = { id?: string; email?: string };
type UserSelect = Partial<Record<keyof SeedUserRow, boolean>>;
type ExhibitionWhere = {
  id?: string;
  organizerId?: string;
  publishStatus?: PublishStatus;
};
type EventWhere = {
  id?: string;
  exhibitionId?: string;
  publishStatus?: PublishStatus;
  startsAt?: Date;
  venueName?: string;
  NOT?: { id?: string };
};

type HoldWhere = {
  id?: string | { in?: string[] };
  customerId?: string;
  eventId?: string;
  holdStatus?: HoldStatus;
  expiresAt?: { lte?: Date; gt?: Date };
};

type EventNestedSelect = {
  where?: EventWhere;
  orderBy?: Prisma.EventOrderByWithRelationInput;
  select?: Prisma.EventSelect;
};

function pickSelected<T extends object>(row: T, select?: object | null): T {
  if (!select) {
    return { ...row };
  }
  const picked = {} as T;
  for (const [key, value] of Object.entries(select)) {
    if (value === true && key in row) {
      picked[key as keyof T] = row[key as keyof T];
    }
  }
  return picked;
}

export async function createSeedUsers(): Promise<SeedUserRow[]> {
  const organizerId = 'user-organizer';
  const users: SeedUserRow[] = [];
  for (const seed of SEED_USERS) {
    users.push({
      id: `user-${seed.role}`,
      email: seed.email,
      passwordHash: await hash(seed.password, 4),
      role: seed.role,
      status: UserStatus.active,
      organizerId: seed.role === Role.gate ? organizerId : null,
      mustChangePassword: false,
    });
  }
  return users;
}

function matchesExhibition(
  row: SeedExhibitionRow,
  where?: ExhibitionWhere,
): boolean {
  return (
    (where?.id === undefined || row.id === where.id) &&
    (where?.organizerId === undefined ||
      row.organizerId === where.organizerId) &&
    (where?.publishStatus === undefined ||
      row.publishStatus === where.publishStatus)
  );
}

function matchesEvent(row: SeedEventRow, where?: EventWhere): boolean {
  return (
    (where?.id === undefined || row.id === where.id) &&
    (where?.exhibitionId === undefined ||
      row.exhibitionId === where.exhibitionId) &&
    (where?.publishStatus === undefined ||
      row.publishStatus === where.publishStatus) &&
    (where?.startsAt === undefined ||
      row.startsAt.getTime() === where.startsAt.getTime()) &&
    (where?.venueName === undefined || row.venueName === where.venueName) &&
    (where?.NOT?.id === undefined || row.id !== where.NOT.id)
  );
}

export function createPrismaMock(
  users: SeedUserRow[],
  exhibitions: SeedExhibitionRow[] = [],
  events: SeedEventRow[] = [],
  options?: { seedSeats?: boolean },
) {
  const exhibitionRows: SeedExhibitionRow[] = exhibitions.map((row) => ({
    ...row,
  }));
  const eventRows: SeedEventRow[] = events.map((row) => ({ ...row }));
  const seatRows: SeedSeatRow[] = [];
  const holdRows: SeedHoldRow[] = [];
  const holdSeatRows: SeedHoldSeatRow[] = [];
  const orderRows: SeedOrderRow[] = [];
  const ticketRows: SeedTicketRow[] = [];
  let sequence = 0;
  const nextId = (prefix: string): string => `${prefix}-${(sequence += 1)}`;

  if (options?.seedSeats) {
    for (const event of eventRows) {
      for (const label of SEAT_LABELS) {
        seatRows.push({ id: nextId('seat'), eventId: event.id, label });
      }
    }
  }

  const sortEvents = (
    rows: SeedEventRow[],
    orderBy?: Prisma.EventOrderByWithRelationInput,
  ) => {
    if (orderBy?.startsAt === 'desc') {
      return [...rows].sort(
        (a, b) => b.startsAt.getTime() - a.startsAt.getTime(),
      );
    }
    if (orderBy?.startsAt === 'asc') {
      return [...rows].sort(
        (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
      );
    }
    return rows;
  };

  const mapExhibition = (
    row: SeedExhibitionRow,
    select?: Prisma.ExhibitionSelect,
  ) => {
    const eventsSelect = select?.events;
    const picked = pickSelected(row, select);
    if (!eventsSelect) {
      return picked;
    }
    const nestedArgs = (
      eventsSelect === true ? {} : eventsSelect
    ) as EventNestedSelect;
    const nested = sortEvents(
      eventRows.filter((event) =>
        matchesEvent(event, {
          exhibitionId: row.id,
          ...nestedArgs.where,
        }),
      ),
      nestedArgs.orderBy,
    );
    return {
      ...picked,
      events: nested.map((event) =>
        pickSelected(event, nestedArgs.select ?? undefined),
      ),
    };
  };

  const models = {
    user: {
      findUnique: jest.fn(
        ({ where, select }: { where: UserWhere; select?: UserSelect }) => {
          const user = where.email
            ? (users.find((row) => row.email === where.email) ?? null)
            : where.id
              ? (users.find((row) => row.id === where.id) ?? null)
              : null;
          if (!user) {
            return null;
          }
          return pickSelected(user, select);
        },
      ),
    },
    exhibition: {
      findMany: jest.fn(
        ({
          where,
          orderBy,
          select,
        }: {
          where?: ExhibitionWhere;
          orderBy?: { title?: 'asc' | 'desc' };
          select?: Prisma.ExhibitionSelect;
        } = {}) => {
          let rows = exhibitionRows.filter((row) =>
            matchesExhibition(row, where),
          );
          if (orderBy?.title === 'asc') {
            rows = [...rows].sort((a, b) => a.title.localeCompare(b.title));
          }
          return rows.map((row) => mapExhibition(row, select));
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where?: ExhibitionWhere;
          select?: Prisma.ExhibitionSelect;
        }) => {
          const row = exhibitionRows.find((exhibition) =>
            matchesExhibition(exhibition, where),
          );
          return row ? mapExhibition(row, select) : null;
        },
      ),
      findUnique: jest.fn(
        ({
          where,
          select,
        }: {
          where: ExhibitionWhere;
          select?: Prisma.ExhibitionSelect;
        }) => {
          const row = exhibitionRows.find(
            (exhibition) => exhibition.id === where.id,
          );
          return row ? mapExhibition(row, select) : null;
        },
      ),
      create: jest.fn(
        ({
          data,
          select,
        }: {
          data: Omit<SeedExhibitionRow, 'id' | 'publishStatus'> & {
            publishStatus?: PublishStatus;
          };
          select?: Prisma.ExhibitionSelect;
        }) => {
          const duplicate = exhibitionRows.some(
            (row) =>
              row.organizerId === data.organizerId &&
              row.tmdbId === data.tmdbId,
          );
          if (duplicate) {
            throw new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed',
              { code: 'P2002', clientVersion: 'test' },
            );
          }
          const row: SeedExhibitionRow = {
            ...data,
            id: nextId('exhibition'),
            publishStatus: data.publishStatus ?? PublishStatus.draft,
          };
          exhibitionRows.push(row);
          return mapExhibition(row, select);
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
          select,
        }: {
          where: ExhibitionWhere;
          data: Partial<SeedExhibitionRow>;
          select?: Prisma.ExhibitionSelect;
        }) => {
          const row = exhibitionRows.find(
            (exhibition) => exhibition.id === where.id,
          );
          if (!row) {
            throw new Error(`exhibition ${String(where.id)} not found`);
          }
          Object.assign(row, data);
          return mapExhibition(row, select);
        },
      ),
    },
    event: {
      findMany: jest.fn(
        ({
          where,
          orderBy,
          select,
        }: {
          where?: EventWhere;
          orderBy?: { startsAt?: 'asc' | 'desc' };
          select?: Prisma.EventSelect;
        } = {}) => {
          const rows = sortEvents(
            eventRows.filter((row) => matchesEvent(row, where)),
            orderBy,
          );
          return rows.map((row) => pickSelected(row, select));
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where?: EventWhere;
          select?: Prisma.EventSelect;
        }) => {
          const row = eventRows.find((event) => matchesEvent(event, where));
          return row ? pickSelected(row, select) : null;
        },
      ),
      findUnique: jest.fn(
        ({
          where,
          select,
        }: {
          where: EventWhere;
          select?: Prisma.EventSelect & {
            exhibition?: boolean | { select?: Prisma.ExhibitionSelect };
            seats?: boolean | { select?: Prisma.SeatSelect };
          };
        }) => {
          const row = eventRows.find((event) => event.id === where.id);
          if (!row) {
            return null;
          }
          const picked = pickSelected(row, select);
          if (select?.exhibition) {
            const exhibition = exhibitionRows.find(
              (item) => item.id === row.exhibitionId,
            );
            const nestedSelect =
              select.exhibition === true ? undefined : select.exhibition.select;
            (picked as unknown as { exhibition: unknown }).exhibition =
              exhibition ? pickSelected(exhibition, nestedSelect) : null;
          }
          return picked;
        },
      ),
      count: jest.fn(
        ({ where }: { where?: EventWhere } = {}) =>
          eventRows.filter((row) => matchesEvent(row, where)).length,
      ),
      create: jest.fn(
        ({
          data,
          select,
        }: {
          data: Omit<SeedEventRow, 'id' | 'publishStatus'> & {
            publishStatus?: PublishStatus;
          };
          select?: Prisma.EventSelect;
        }) => {
          const duplicate = eventRows.some(
            (row) =>
              row.exhibitionId === data.exhibitionId &&
              row.startsAt.getTime() === data.startsAt.getTime() &&
              row.venueName === data.venueName,
          );
          if (duplicate) {
            throw new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed',
              { code: 'P2002', clientVersion: 'test' },
            );
          }
          const row: SeedEventRow = {
            ...data,
            id: nextId('event'),
            publishStatus: data.publishStatus ?? PublishStatus.draft,
          };
          eventRows.push(row);
          return pickSelected(row, select);
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
          select,
        }: {
          where: EventWhere;
          data: Partial<SeedEventRow>;
          select?: Prisma.EventSelect;
        }) => {
          const row = eventRows.find((event) => event.id === where.id);
          if (!row) {
            throw new Error(`event ${String(where.id)} not found`);
          }
          Object.assign(row, data);
          return pickSelected(row, select);
        },
      ),
    },
    seat: {
      createMany: jest.fn(({ data }: { data: Omit<SeedSeatRow, 'id'>[] }) => {
        for (const seat of data) {
          seatRows.push({ ...seat, id: nextId('seat') });
        }
        return { count: data.length };
      }),
      count: jest.fn(
        ({ where }: { where?: { eventId?: string } } = {}) =>
          seatRows.filter(
            (seat) =>
              where?.eventId === undefined || seat.eventId === where.eventId,
          ).length,
      ),
      findMany: jest.fn(
        ({
          where,
        }: {
          where?: { eventId?: string; label?: { in?: string[] } };
        } = {}) =>
          Promise.resolve(
            seatRows
              .filter(
                (seat) =>
                  (where?.eventId === undefined ||
                    seat.eventId === where.eventId) &&
                  (where?.label?.in === undefined ||
                    where.label.in.includes(seat.label)),
              )
              .map((seat) => mapOccupancySeat(seat)),
          ),
      ),
    },
    hold: {
      findMany: jest.fn(
        ({
          where,
          select,
        }: {
          where?: HoldWhere;
          select?: object;
        } = {}) =>
          Promise.resolve(
            holdRows
              .filter((row) => matchesHold(row, where))
              .map((row) => pickSelected(row, select)),
          ),
      ),
      findFirst: jest.fn(
        ({ where, select }: { where?: HoldWhere; select?: object }) => {
          const row = holdRows.find((hold) => matchesHold(hold, where));
          return Promise.resolve(row ? pickSelected(row, select) : null);
        },
      ),
      findUnique: jest.fn(
        ({ where, select }: { where: { id: string }; select?: object }) => {
          const row = holdRows.find((hold) => hold.id === where.id);
          return Promise.resolve(row ? mapHoldDetail(row, select) : null);
        },
      ),
      create: jest.fn(
        ({
          data,
          select,
        }: {
          data: Omit<SeedHoldRow, 'id' | 'holdStatus'> & {
            holdStatus?: HoldStatus;
          };
          select?: object;
        }) => {
          const row: SeedHoldRow = {
            ...data,
            id: nextId('hold'),
            holdStatus: data.holdStatus ?? HoldStatus.active,
          };
          holdRows.push(row);
          return Promise.resolve(pickSelected(row, select));
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<SeedHoldRow>;
        }) => {
          const row = holdRows.find((hold) => hold.id === where.id);
          if (!row) {
            throw new Error(`hold ${where.id} not found`);
          }
          Object.assign(row, data);
          return Promise.resolve(row);
        },
      ),
      updateMany: jest.fn(
        ({ where, data }: { where: HoldWhere; data: Partial<SeedHoldRow> }) => {
          let count = 0;
          for (const row of holdRows) {
            if (matchesHold(row, where)) {
              Object.assign(row, data);
              count += 1;
            }
          }
          return Promise.resolve({ count });
        },
      ),
    },
    holdSeat: {
      createMany: jest.fn(({ data }: { data: SeedHoldSeatRow[] }) => {
        for (const row of data) {
          if (holdSeatRows.some((item) => item.seatId === row.seatId)) {
            throw new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed',
              { code: 'P2002', clientVersion: 'test' },
            );
          }
          holdSeatRows.push({ ...row });
        }
        return Promise.resolve({ count: data.length });
      }),
      deleteMany: jest.fn(
        ({ where }: { where?: { holdId?: string | { in?: string[] } } }) => {
          const ids =
            typeof where?.holdId === 'string'
              ? [where.holdId]
              : (where?.holdId?.in ?? []);
          const before = holdSeatRows.length;
          for (let index = holdSeatRows.length - 1; index >= 0; index -= 1) {
            const row = holdSeatRows[index];
            if (row && ids.includes(row.holdId)) {
              holdSeatRows.splice(index, 1);
            }
          }
          return Promise.resolve({ count: before - holdSeatRows.length });
        },
      ),
    },
    order: {
      create: jest.fn(
        ({
          data,
          select,
        }: {
          data: Omit<SeedOrderRow, 'id'>;
          select?: object;
        }) => {
          if (orderRows.some((row) => row.holdId === data.holdId)) {
            throw new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed',
              { code: 'P2002', clientVersion: 'test' },
            );
          }
          const row: SeedOrderRow = { ...data, id: nextId('order') };
          orderRows.push(row);
          return Promise.resolve(pickSelected(row, select));
        },
      ),
      findUnique: jest.fn(
        ({
          where,
          select,
        }: {
          where: { id?: string; holdId?: string };
          select?: object;
        }) => {
          const row = orderRows.find(
            (order) =>
              (where.id !== undefined && order.id === where.id) ||
              (where.holdId !== undefined && order.holdId === where.holdId),
          );
          return Promise.resolve(row ? pickSelected(row, select) : null);
        },
      ),
    },
    ticket: {
      createMany: jest.fn(({ data }: { data: Omit<SeedTicketRow, 'id'>[] }) => {
        for (const row of data) {
          if (
            ticketRows.some(
              (item) => item.seatId === row.seatId && item.cancelledAt === null,
            )
          ) {
            throw new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed',
              { code: 'P2002', clientVersion: 'test' },
            );
          }
          ticketRows.push({ ...row, id: nextId('ticket') });
        }
        return Promise.resolve({ count: data.length });
      }),
      create: jest.fn(
        ({
          data,
          select,
        }: {
          data: Omit<SeedTicketRow, 'id' | 'cancelledAt'> & {
            cancelledAt?: Date | null;
          };
          select?: object;
        }) => {
          if (
            ticketRows.some(
              (item) =>
                item.seatId === data.seatId && item.cancelledAt === null,
            )
          ) {
            throw new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed',
              { code: 'P2002', clientVersion: 'test' },
            );
          }
          const row: SeedTicketRow = {
            ...data,
            id: nextId('ticket'),
            cancelledAt: data.cancelledAt ?? null,
          };
          ticketRows.push(row);
          const seat = seatRows.find((item) => item.id === row.seatId);
          const picked = pickSelected(row, select);
          if (select && 'seat' in select) {
            return Promise.resolve({
              ...picked,
              seat: { label: seat?.label ?? '' },
            });
          }
          return Promise.resolve(picked);
        },
      ),
    },
  };

  function mapOccupancySeat(seat: SeedSeatRow) {
    const ticket = ticketRows.find((row) => row.seatId === seat.id) ?? null;
    const holdSeat = holdSeatRows.find((row) => row.seatId === seat.id);
    const hold = holdSeat
      ? (holdRows.find((row) => row.id === holdSeat.holdId) ?? null)
      : null;
    return {
      id: seat.id,
      label: seat.label,
      ticket: ticket
        ? { id: ticket.id, cancelledAt: ticket.cancelledAt }
        : null,
      holdSeat: hold
        ? {
            hold: {
              id: hold.id,
              customerId: hold.customerId,
              holdStatus: hold.holdStatus,
              expiresAt: hold.expiresAt,
            },
          }
        : null,
    };
  }

  function mapHoldDetail(row: SeedHoldRow, select?: object) {
    const picked = pickSelected(row, select);
    const event = eventRows.find((item) => item.id === row.eventId);
    const exhibition = event
      ? exhibitionRows.find((item) => item.id === event.exhibitionId)
      : undefined;
    const order = orderRows.find((item) => item.holdId === row.id);
    return {
      ...picked,
      order: order ? { id: order.id } : null,
      holdSeats: holdSeatRows
        .filter((item) => item.holdId === row.id)
        .map((item) => {
          const seat = seatRows.find((s) => s.id === item.seatId);
          return {
            seat: { id: seat?.id ?? item.seatId, label: seat?.label ?? '' },
          };
        }),
      event: event
        ? {
            ...pickSelected(event, undefined),
            exhibition: exhibition ? pickSelected(exhibition, undefined) : null,
          }
        : null,
    };
  }

  function matchesHold(row: SeedHoldRow, where?: HoldWhere): boolean {
    if (!where) {
      return true;
    }
    if (typeof where.id === 'string' && row.id !== where.id) {
      return false;
    }
    if (
      where.id &&
      typeof where.id === 'object' &&
      where.id.in &&
      !where.id.in.includes(row.id)
    ) {
      return false;
    }
    if (where.customerId !== undefined && row.customerId !== where.customerId) {
      return false;
    }
    if (where.eventId !== undefined && row.eventId !== where.eventId) {
      return false;
    }
    if (where.holdStatus !== undefined && row.holdStatus !== where.holdStatus) {
      return false;
    }
    if (
      where.expiresAt?.lte !== undefined &&
      row.expiresAt.getTime() > where.expiresAt.lte.getTime()
    ) {
      return false;
    }
    if (
      where.expiresAt?.gt !== undefined &&
      row.expiresAt.getTime() <= where.expiresAt.gt.getTime()
    ) {
      return false;
    }
    return true;
  }

  return {
    ...models,
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: jest.fn(
      (work: (tx: typeof models) => unknown): Promise<unknown> =>
        Promise.resolve(work(models)),
    ),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;

export async function createE2eApp(options?: {
  controllers?: Type<unknown>[];
  exhibitions?: SeedExhibitionRow[];
  events?: SeedEventRow[];
  seedSeats?: boolean;
  tmdbAxios?: TmdbAxiosMock;
}): Promise<{
  app: INestApplication;
  server: App;
  users: SeedUserRow[];
  prisma: PrismaMock;
}> {
  const users = await createSeedUsers();
  const prisma = createPrismaMock(
    users,
    options?.exhibitions ?? [],
    options?.events ?? [],
    { seedSeats: options?.seedSeats },
  );
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: options?.controllers ?? [],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(TMDB_AXIOS)
    .useValue(options?.tmdbAxios ?? createTmdbAxiosMock())
    .compile();

  const app = moduleRef.createNestApplication();
  setupApp(app);
  await app.init();

  return {
    app,
    server: app.getHttpServer() as App,
    users,
    prisma,
  };
}

export function readLoginBody(body: unknown): LoginBody {
  return body as LoginBody;
}

export function readProfileBody(body: unknown): ProfileBody {
  return body as ProfileBody;
}

export function decodeJwtPayload(token: string): { sub: string; role: Role } {
  const parts = token.split('.');
  const payload = parts[1];
  if (!payload) {
    throw new Error('token sem payload');
  }
  return JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
    sub: string;
    role: Role;
  };
}
