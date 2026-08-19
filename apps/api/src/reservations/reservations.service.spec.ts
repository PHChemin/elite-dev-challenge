import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HoldStatus, Prisma, PublishStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { addMs, toDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { HOLD_TTL_MS } from './reservations.constants';
import { ReservationsService } from './reservations.service';

const CUSTOMER_ID = 'user-customer';
const OTHER_ID = 'user-other';
const EVENT_ID = 'event-1';
const NOW = toDate('2026-09-01T19:00:00.000Z');
const STARTS_AT = addMs(NOW, 2 * 60 * 60 * 1000);

const eventRow = {
  id: EVENT_ID,
  startsAt: STARTS_AT,
  venueName: 'Cine PHC',
  venueAddress: 'Rua A, 100',
  priceFull: 4000,
  priceHalf: 2000,
  maxTicketsPerOrder: 6,
  publishStatus: PublishStatus.published,
  exhibition: {
    id: 'exhibition-1',
    title: 'Clube da Luta',
    posterUrl: null,
    publishStatus: PublishStatus.published,
  },
};

function occupancySeat(
  label: string,
  extra: {
    ticket?: { id: string; cancelledAt: Date | null } | null;
    hold?: {
      id: string;
      customerId: string;
      holdStatus: HoldStatus;
      expiresAt: Date;
    } | null;
  } = {},
) {
  return {
    id: `seat-${label}`,
    label,
    ticket: extra.ticket ?? null,
    holdSeat: extra.hold ? { hold: extra.hold } : null,
  };
}

describe('ReservationsService', () => {
  let service: ReservationsService;
  const prisma: {
    $transaction: jest.Mock;
    hold: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    holdSeat: { deleteMany: jest.Mock; createMany: jest.Mock };
    event: { findUnique: jest.Mock };
    seat: { findMany: jest.Mock };
  } = {
    $transaction: jest.fn(),
    hold: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    holdSeat: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    event: { findUnique: jest.fn() },
    seat: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    prisma.$transaction.mockImplementation(
      (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    prisma.hold.findMany.mockResolvedValue([]);
    prisma.hold.findFirst.mockResolvedValue(null);
    prisma.holdSeat.deleteMany.mockResolvedValue({ count: 0 });
    prisma.hold.updateMany.mockResolvedValue({ count: 0 });
    prisma.event.findUnique.mockResolvedValue(eventRow);
    prisma.seat.findMany.mockImplementation(
      ({ where }: { where?: { label?: { in?: string[] } } }) => {
        const labels = where?.label?.in ?? ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
        return Promise.resolve(labels.map((label) => occupancySeat(label)));
      },
    );
    prisma.hold.create.mockResolvedValue({ id: 'hold-1' });
    prisma.hold.findUnique.mockResolvedValue({
      id: 'hold-1',
      eventId: EVENT_ID,
      customerId: CUSTOMER_ID,
      fullCount: 2,
      halfCount: 0,
      expiresAt: addMs(NOW, HOLD_TTL_MS),
      holdStatus: HoldStatus.active,
      holdSeats: [{ seat: { label: 'A1' } }, { seat: { label: 'A2' } }],
      event: eventRow,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compile();
    service = module.get(ReservationsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createHold', () => {
    it('holds N seats when N equals fullCount + halfCount', async () => {
      const result = await service.createHold(CUSTOMER_ID, {
        eventId: EVENT_ID,
        seatLabels: ['A1', 'A2'],
        fullCount: 2,
        halfCount: 0,
      });

      expect(prisma.hold.create).toHaveBeenCalled();
      expect(prisma.holdSeat.createMany).toHaveBeenCalledWith({
        data: [
          { holdId: 'hold-1', seatId: 'seat-A1' },
          { holdId: 'hold-1', seatId: 'seat-A2' },
        ],
      });
      expect(result.seatLabels).toEqual(['A1', 'A2']);
      expect(result.fullCount + result.halfCount).toBe(2);
    });

    it('lets a new hold take seats from a hold that already expired', async () => {
      prisma.hold.findMany.mockResolvedValue([{ id: 'old-hold' }]);
      prisma.seat.findMany.mockResolvedValueOnce([
        occupancySeat('A1', {
          hold: {
            id: 'old-hold',
            customerId: OTHER_ID,
            holdStatus: HoldStatus.active,
            expiresAt: addMs(NOW, -1000),
          },
        }),
        occupancySeat('A2'),
      ]);
      prisma.seat.findMany.mockResolvedValueOnce([
        occupancySeat('A1'),
        occupancySeat('A2'),
      ]);

      await service.createHold(CUSTOMER_ID, {
        eventId: EVENT_ID,
        seatLabels: ['A1', 'A2'],
        fullCount: 1,
        halfCount: 1,
      });

      expect(prisma.holdSeat.deleteMany).toHaveBeenCalledWith({
        where: { holdId: { in: ['old-hold'] } },
      });
      expect(prisma.hold.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['old-hold'] } },
        data: { holdStatus: HoldStatus.expired },
      });
      expect(prisma.hold.create).toHaveBeenCalled();
    });

    it('rejects a hold above the event cap', async () => {
      await expect(
        service.createHold(CUSTOMER_ID, {
          eventId: EVENT_ID,
          seatLabels: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
          fullCount: 7,
          halfCount: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.hold.create).not.toHaveBeenCalled();
    });

    it('rejects a hold after the event has started', async () => {
      prisma.event.findUnique.mockResolvedValue({
        ...eventRow,
        startsAt: addMs(NOW, -1000),
      });

      await expect(
        service.createHold(CUSTOMER_ID, {
          eventId: EVENT_ID,
          seatLabels: ['A1'],
          fullCount: 1,
          halfCount: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.hold.create).not.toHaveBeenCalled();
    });

    it('rejects a hold larger than the free seat count', async () => {
      prisma.seat.findMany.mockImplementation(
        ({
          where,
        }: {
          where?: { eventId?: string; label?: { in?: string[] } };
        }) => {
          if (where?.label?.in) {
            return Promise.resolve(
              where.label.in.map((label, index) =>
                occupancySeat(
                  label,
                  index === 0
                    ? { ticket: { id: 't1', cancelledAt: null } }
                    : {},
                ),
              ),
            );
          }
          return Promise.resolve([
            occupancySeat('A1'),
            occupancySeat('A2'),
            occupancySeat('A3'),
            occupancySeat('A4'),
            occupancySeat('A5'),
            occupancySeat('A6', {
              ticket: { id: 't1', cancelledAt: null },
            }),
          ]);
        },
      );

      await expect(
        service.createHold(CUSTOMER_ID, {
          eventId: EVENT_ID,
          seatLabels: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
          fullCount: 6,
          halfCount: 0,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.hold.create).not.toHaveBeenCalled();
    });

    it('rejects a second active hold on the same seat', async () => {
      prisma.seat.findMany.mockImplementation(
        ({ where }: { where?: { label?: { in?: string[] } } }) => {
          const labels = where?.label?.in ?? ['A1'];
          return Promise.resolve(
            labels.map((label) =>
              occupancySeat(label, {
                hold: {
                  id: 'live-hold',
                  customerId: OTHER_ID,
                  holdStatus: HoldStatus.active,
                  expiresAt: addMs(NOW, HOLD_TTL_MS),
                },
              }),
            ),
          );
        },
      );

      await expect(
        service.createHold(CUSTOMER_ID, {
          eventId: EVENT_ID,
          seatLabels: ['A1'],
          fullCount: 1,
          halfCount: 0,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps a unique constraint on HoldSeat to a conflict', async () => {
      prisma.holdSeat.createMany.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.createHold(CUSTOMER_ID, {
          eventId: EVENT_ID,
          seatLabels: ['A1'],
          fullCount: 1,
          halfCount: 0,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('conflicts when two customers hold the same two seats at once', async () => {
      let holdSeq = 0;
      prisma.hold.create.mockImplementation(() => {
        holdSeq += 1;
        return Promise.resolve({ id: `hold-${holdSeq}` });
      });
      let inserts = 0;
      prisma.holdSeat.createMany.mockImplementation(() => {
        inserts += 1;
        if (inserts === 1) {
          return Promise.resolve({ count: 2 });
        }
        return Promise.reject(
          new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          }),
        );
      });
      prisma.hold.findUnique.mockImplementation(
        ({ where }: { where: { id: string } }) =>
          Promise.resolve({
            id: where.id,
            eventId: EVENT_ID,
            customerId: CUSTOMER_ID,
            fullCount: 2,
            halfCount: 0,
            expiresAt: addMs(NOW, HOLD_TTL_MS),
            holdStatus: HoldStatus.active,
            holdSeats: [{ seat: { label: 'A1' } }, { seat: { label: 'A2' } }],
            event: eventRow,
          }),
      );

      const payload = {
        eventId: EVENT_ID,
        seatLabels: ['A1', 'A2'],
        fullCount: 2,
        halfCount: 0,
      };
      const results = await Promise.allSettled([
        service.createHold(CUSTOMER_ID, payload),
        service.createHold(OTHER_ID, payload),
      ]);
      const fulfilled = results.filter((item) => item.status === 'fulfilled');
      const rejected = results.filter((item) => item.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      if (rejected[0]?.status === 'rejected') {
        expect(rejected[0].reason).toBeInstanceOf(ConflictException);
      }
    });
  });

  describe('findMine', () => {
    it('returns an active hold that still has time left', async () => {
      const result = await service.findMine(CUSTOMER_ID, 'hold-1');
      expect(result.id).toBe('hold-1');
    });

    it('rejects a hold that belongs to another customer', async () => {
      await expect(service.findMine(OTHER_ID, 'hold-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rejects an expired hold as not found', async () => {
      prisma.hold.findUnique.mockResolvedValue({
        id: 'hold-1',
        eventId: EVENT_ID,
        customerId: CUSTOMER_ID,
        fullCount: 1,
        halfCount: 0,
        expiresAt: addMs(NOW, -1000),
        holdStatus: HoldStatus.active,
        holdSeats: [{ seat: { label: 'A1' } }],
        event: eventRow,
      });

      await expect(
        service.findMine(CUSTOMER_ID, 'hold-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listMineHolds', () => {
    it('lists active pending holds for the owner', async () => {
      prisma.hold.findMany.mockResolvedValue([
        {
          id: 'hold-1',
          eventId: EVENT_ID,
          customerId: CUSTOMER_ID,
          fullCount: 1,
          halfCount: 1,
          expiresAt: addMs(NOW, HOLD_TTL_MS),
          holdStatus: HoldStatus.active,
          holdSeats: [
            { seat: { label: 'A1' } },
            { seat: { label: 'A2' } },
          ],
          event: eventRow,
        },
      ]);

      const result = await service.listMineHolds(CUSTOMER_ID);

      expect(prisma.hold.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: CUSTOMER_ID,
            holdStatus: HoldStatus.active,
            order: null,
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('hold-1');
    });

    it('returns an empty list when the customer has no active hold', async () => {
      prisma.hold.findMany.mockResolvedValue([]);

      const result = await service.listMineHolds(CUSTOMER_ID);

      expect(result).toEqual([]);
    });

    it('scopes pending holds to the authenticated customer', async () => {
      prisma.hold.findMany.mockResolvedValue([]);

      await service.listMineHolds(OTHER_ID);

      expect(prisma.hold.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: OTHER_ID }),
        }),
      );
    });
  });
});
