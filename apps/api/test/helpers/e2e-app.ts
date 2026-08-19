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
import { SEED_USERS, seedUserIdFromEmail } from '../../prisma/seed-users';
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
  runtimeMinutes?: number | null;
  overview?: string | null;
  releaseDate?: string | null;
  genres?: unknown;
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
  usedAt?: Date | null;
  validatedByUserId?: string | null;
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
  title?: { contains?: string; mode?: 'insensitive' };
  events?: { some?: EventWhere };
};
type EventWhere = {
  id?: string;
  exhibitionId?: string;
  publishStatus?: PublishStatus;
  startsAt?: Date;
  venueName?: string;
  NOT?: { id?: string };
  exhibition?: {
    organizerId?: string;
    publishStatus?: PublishStatus;
  };
};

type HoldWhere = {
  id?: string | { in?: string[] };
  customerId?: string;
  eventId?: string;
  holdStatus?: HoldStatus;
  expiresAt?: { lte?: Date; gt?: Date };
  order?: null;
};

type TicketWhere = {
  customerId?: string;
  shareToken?: string;
  code?: string;
  eventId?: string;
  cancelledAt?: null;
  id?: string;
  usedAt?: null;
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
      id: seedUserIdFromEmail(seed.email),
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
  eventRows: SeedEventRow[] = [],
): boolean {
  if (where?.id !== undefined && row.id !== where.id) {
    return false;
  }
  if (
    where?.organizerId !== undefined &&
    row.organizerId !== where.organizerId
  ) {
    return false;
  }
  if (
    where?.publishStatus !== undefined &&
    row.publishStatus !== where.publishStatus
  ) {
    return false;
  }
  if (where?.title?.contains !== undefined) {
    const haystack = row.title.toLowerCase();
    const needle = where.title.contains.toLowerCase();
    if (!haystack.includes(needle)) {
      return false;
    }
  }
  if (where?.events?.some !== undefined) {
    const hasEvent = eventRows.some(
      (event) =>
        event.exhibitionId === row.id &&
        matchesEvent(event, where.events?.some),
    );
    if (!hasEvent) {
      return false;
    }
  }
  return true;
}

function matchesEvent(
  row: SeedEventRow,
  where?: EventWhere,
  eventRows: SeedEventRow[] = [],
  exhibitionRows: SeedExhibitionRow[] = [],
): boolean {
  const base =
    (where?.id === undefined || row.id === where.id) &&
    (where?.exhibitionId === undefined ||
      row.exhibitionId === where.exhibitionId) &&
    (where?.publishStatus === undefined ||
      row.publishStatus === where.publishStatus) &&
    (where?.startsAt === undefined ||
      row.startsAt.getTime() === where.startsAt.getTime()) &&
    (where?.venueName === undefined || row.venueName === where.venueName) &&
    (where?.NOT?.id === undefined || row.id !== where.NOT.id);

  if (!base) {
    return false;
  }
  if (!where?.exhibition) {
    return true;
  }
  const exhibition = exhibitionRows.find(
    (item) => item.id === row.exhibitionId,
  );
  if (!exhibition) {
    return false;
  }
  if (
    where.exhibition.organizerId !== undefined &&
    exhibition.organizerId !== where.exhibition.organizerId
  ) {
    return false;
  }
  if (
    where.exhibition.publishStatus !== undefined &&
    exhibition.publishStatus !== where.exhibition.publishStatus
  ) {
    return false;
  }
  return true;
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
        matchesEvent(
          event,
          {
            exhibitionId: row.id,
            ...nestedArgs.where,
          },
          eventRows,
          exhibitionRows,
        ),
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

  const mapEventDetail = (
    row: SeedEventRow,
    select?: Prisma.EventSelect & {
      exhibition?: boolean | { select?: Prisma.ExhibitionSelect };
    },
  ) => {
    const picked = pickSelected(row, select);
    if (select?.exhibition) {
      const exhibition = exhibitionRows.find(
        (item) => item.id === row.exhibitionId,
      );
      const nestedSelect =
        select.exhibition === true ? undefined : select.exhibition.select;
      (picked as unknown as { exhibition: unknown }).exhibition = exhibition
        ? pickSelected(exhibition, nestedSelect)
        : null;
    }
    return picked;
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
      count: jest.fn(({ where }: { where?: ExhibitionWhere } = {}) => {
        return exhibitionRows.filter((row) =>
          matchesExhibition(row, where, eventRows),
        ).length;
      }),
      findMany: jest.fn(
        ({
          where,
          orderBy,
          select,
          skip,
          take,
        }: {
          where?: ExhibitionWhere;
          orderBy?: { title?: 'asc' | 'desc' };
          select?: Prisma.ExhibitionSelect;
          skip?: number;
          take?: number;
        } = {}) => {
          let rows = exhibitionRows.filter((row) =>
            matchesExhibition(row, where, eventRows),
          );
          if (orderBy?.title === 'asc') {
            rows = [...rows].sort((a, b) => a.title.localeCompare(b.title));
          }
          if (skip !== undefined) {
            rows = rows.slice(skip);
          }
          if (take !== undefined) {
            rows = rows.slice(0, take);
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
            matchesExhibition(exhibition, where, eventRows),
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
            eventRows.filter((row) =>
              matchesEvent(row, where, eventRows, exhibitionRows),
            ),
            orderBy,
          );
          return rows.map((row) => mapEventDetail(row, select));
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
          const row = eventRows.find((event) =>
            matchesEvent(event, where, eventRows, exhibitionRows),
          );
          return row ? mapEventDetail(row, select) : null;
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
          const picked = mapEventDetail(row, select);
          if (select?.seats) {
            const seats = seatRows.filter((seat) => seat.eventId === row.id);
            (picked as unknown as { seats: unknown }).seats = seats.map((seat) =>
              pickSelected(
                seat,
                select.seats === true ? undefined : select.seats.select,
              ),
            );
          }
          return picked;
        },
      ),
      count: jest.fn(
        ({ where }: { where?: EventWhere } = {}) =>
          eventRows.filter((row) =>
            matchesEvent(row, where, eventRows, exhibitionRows),
          ).length,
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
        } = {}) => {
          let rows = holdRows.filter((row) => matchesHold(row, where));
          if (where?.order === null) {
            rows = rows.filter(
              (row) => !orderRows.some((order) => order.holdId === row.id),
            );
          }
          return Promise.resolve(
            rows.map((row) =>
              select && ('holdSeats' in select || 'event' in select)
                ? mapHoldDetail(row, select)
                : pickSelected(row, select),
            ),
          );
        },
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
      findMany: jest.fn(
        ({
          where,
          select,
          orderBy,
        }: {
          where?: TicketWhere;
          select?: object;
          orderBy?: unknown;
        } = {}) => {
          let rows = ticketRows.filter((row) => matchesTicket(row, where));
          if (orderBy) {
            rows = sortTickets(rows);
          }
          return Promise.resolve(
            rows.map((row) => mapTicketDetail(row, select)),
          );
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where?: TicketWhere;
          select?: object;
        }) => {
          const row = ticketRows.find((ticket) => matchesTicket(ticket, where));
          return Promise.resolve(row ? mapTicketDetail(row, select) : null);
        },
      ),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where?: TicketWhere;
          data: {
            usedAt?: Date | null;
            validatedByUserId?: string | null;
          };
        }) => {
          let count = 0;
          for (const row of ticketRows) {
            if (!matchesTicket(row, where)) {
              continue;
            }
            if (data.usedAt !== undefined) {
              row.usedAt = data.usedAt;
            }
            if (data.validatedByUserId !== undefined) {
              row.validatedByUserId = data.validatedByUserId;
            }
            count += 1;
          }
          return Promise.resolve({ count });
        },
      ),
    },
  };

  function matchesTicket(row: SeedTicketRow, where?: TicketWhere): boolean {
    if (!where) {
      return true;
    }
    if (where.id !== undefined && row.id !== where.id) {
      return false;
    }
    if (where.code !== undefined && row.code !== where.code) {
      return false;
    }
    if (where.eventId !== undefined && row.eventId !== where.eventId) {
      return false;
    }
    if (where.usedAt === null && row.usedAt != null) {
      return false;
    }
    if (where.customerId !== undefined && row.customerId !== where.customerId) {
      return false;
    }
    if (where.shareToken !== undefined && row.shareToken !== where.shareToken) {
      return false;
    }
    if (where.cancelledAt === null && row.cancelledAt !== null) {
      return false;
    }
    return true;
  }

  function sortTickets(rows: SeedTicketRow[]) {
    return [...rows].sort((left, right) => {
      const leftEvent = eventRows.find((event) => event.id === left.eventId);
      const rightEvent = eventRows.find((event) => event.id === right.eventId);
      const leftTime = leftEvent?.startsAt.getTime() ?? 0;
      const rightTime = rightEvent?.startsAt.getTime() ?? 0;
      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }
      const leftSeat = seatRows.find((seat) => seat.id === left.seatId);
      const rightSeat = seatRows.find((seat) => seat.id === right.seatId);
      return (leftSeat?.label ?? '').localeCompare(
        rightSeat?.label ?? '',
        'en',
      );
    });
  }

  function mapTicketDetail(row: SeedTicketRow, select?: object | null) {
    const picked = pickSelected(row, select);
    const seat = seatRows.find((item) => item.id === row.seatId);
    const event = eventRows.find((item) => item.id === row.eventId);
    const exhibition = event
      ? exhibitionRows.find((item) => item.id === event.exhibitionId)
      : undefined;
    const mapped = { ...picked } as Record<string, unknown>;
    if (select && 'seat' in select) {
      mapped.seat = { label: seat?.label ?? '' };
    }
    if (select && 'event' in select && event) {
      const eventSelect =
        select.event === true
          ? undefined
          : (select.event as { select?: object }).select;
      mapped.event = {
        ...pickSelected(event, eventSelect),
        exhibition: exhibition
          ? pickSelected(
              exhibition,
              eventSelect && 'exhibition' in eventSelect
                ? (eventSelect.exhibition as { select?: object }).select
                : undefined,
            )
          : null,
      };
    }
    return mapped;
  }

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
