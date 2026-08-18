import { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, PublishStatus, Role, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { App } from 'supertest/types';
import { TMDB_AXIOS } from '../../src/catalog/tmdb/tmdb.constants';
import { AppModule } from '../../src/app.module';
import { setupApp } from '../../src/common/setup-app';
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

type EventNestedSelect = {
  where?: EventWhere;
  orderBy?: Prisma.EventOrderByWithRelationInput;
  select?: Prisma.EventSelect;
};

function pickSelected<T extends object>(
  row: T,
  select?: object | null,
): Record<string, unknown> {
  if (!select) {
    return { ...row };
  }
  const picked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(select)) {
    if (value === true && key in row) {
      picked[key] = row[key as keyof T];
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
) {
  const exhibitionRows: SeedExhibitionRow[] = exhibitions.map((row) => ({
    ...row,
  }));
  const eventRows: SeedEventRow[] = events.map((row) => ({ ...row }));
  const seatRows: SeedSeatRow[] = [];
  let sequence = 0;
  const nextId = (prefix: string): string => `${prefix}-${(sequence += 1)}`;

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
    const nestedArgs: EventNestedSelect =
      eventsSelect === true ? {} : eventsSelect;
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
            exhibition?: { select?: { organizerId?: boolean } };
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
            return {
              ...(picked as object),
              exhibitionId: row.exhibitionId,
              exhibition: exhibition
                ? { organizerId: exhibition.organizerId }
                : null,
            };
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
    },
  };

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
