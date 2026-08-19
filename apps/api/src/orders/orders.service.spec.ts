import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HoldStatus, PaymentStatus, Prisma, TicketKind } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { addMs, toDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { HOLD_TTL_MS } from '../reservations/reservations.constants';
import { ReservationsService } from '../reservations/reservations.service';
import { OrdersService } from './orders.service';

const CUSTOMER_ID = 'user-customer';
const OTHER_ID = 'user-other';
const HOLD_ID = 'hold-1';
const EVENT_ID = 'event-1';
const NOW = toDate('2026-09-01T19:00:00.000Z');

const eventRow = {
  id: EVENT_ID,
  priceFull: 4000,
  priceHalf: 2000,
};

type HoldRowExtra = {
  customerId?: string;
  holdStatus?: HoldStatus;
  expiresAt?: Date;
  order?: { id: string } | null;
};

function holdRow(extra: HoldRowExtra = {}) {
  return {
    id: HOLD_ID,
    eventId: EVENT_ID,
    customerId: extra.customerId ?? CUSTOMER_ID,
    fullCount: 1,
    halfCount: 1,
    expiresAt: extra.expiresAt ?? addMs(NOW, HOLD_TTL_MS),
    holdStatus: extra.holdStatus ?? HoldStatus.active,
    order: extra.order ?? null,
    holdSeats: [
      { seat: { id: 'seat-A2', label: 'A2' } },
      { seat: { id: 'seat-A1', label: 'A1' } },
    ],
    event: eventRow,
  };
}

function firstArg<T>(mock: { mock: { calls: unknown[][] } }, index = 0): T {
  const call = mock.mock.calls[index];
  const arg = call?.[0];
  if (arg === undefined) {
    throw new Error('missing mock call');
  }
  return arg as T;
}

describe('OrdersService', () => {
  let service: OrdersService;
  const prisma: {
    $transaction: jest.Mock;
    hold: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    holdSeat: { deleteMany: jest.Mock };
    order: { create: jest.Mock };
    ticket: { create: jest.Mock };
  } = {
    $transaction: jest.fn(),
    hold: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    holdSeat: { deleteMany: jest.fn() },
    order: { create: jest.fn() },
    ticket: { create: jest.fn() },
  };
  const reservations = {
    releaseExpired: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    prisma.$transaction.mockImplementation(
      (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    reservations.releaseExpired.mockResolvedValue(undefined);
    prisma.hold.findUnique.mockResolvedValue(holdRow());
    prisma.order.create.mockResolvedValue({ id: 'order-1' });
    prisma.holdSeat.deleteMany.mockResolvedValue({ count: 2 });
    prisma.hold.update.mockResolvedValue({ id: HOLD_ID });
    let ticketSeq = 0;
    prisma.ticket.create.mockImplementation(
      ({ data }: { data: { kind: TicketKind; seatId: string } }) => {
        ticketSeq += 1;
        return Promise.resolve({
          id: `ticket-${ticketSeq}`,
          kind: data.kind,
          seat: {
            label: data.seatId === 'seat-A1' ? 'A1' : 'A2',
          },
        });
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReservationsService, useValue: reservations },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('approved gera um ticket por assento com kind full e half', async () => {
    const result = await service.pay(CUSTOMER_ID, {
      holdId: HOLD_ID,
      result: PaymentStatus.approved,
    });

    expect(reservations.releaseExpired).toHaveBeenCalledWith(prisma);
    const createdOrder = firstArg<{
      data: {
        customerId: string;
        holdId: string;
        paymentStatus: PaymentStatus;
        totalCents: number;
      };
    }>(prisma.order.create);
    expect(createdOrder.data).toMatchObject({
      customerId: CUSTOMER_ID,
      holdId: HOLD_ID,
      paymentStatus: PaymentStatus.approved,
      totalCents: 6000,
    });
    expect(prisma.ticket.create).toHaveBeenCalledTimes(2);
    const firstTicket = firstArg<{
      data: { seatId: string; kind: TicketKind };
    }>(prisma.ticket.create, 0);
    const secondTicket = firstArg<{
      data: { seatId: string; kind: TicketKind };
    }>(prisma.ticket.create, 1);
    expect(firstTicket.data).toMatchObject({
      seatId: 'seat-A1',
      kind: TicketKind.full,
    });
    expect(secondTicket.data).toMatchObject({
      seatId: 'seat-A2',
      kind: TicketKind.half,
    });
    expect(prisma.holdSeat.deleteMany).toHaveBeenCalledWith({
      where: { holdId: HOLD_ID },
    });
    expect(prisma.hold.update).toHaveBeenCalledWith({
      where: { id: HOLD_ID },
      data: { holdStatus: HoldStatus.converted },
    });
    expect(result).toMatchObject({
      id: 'order-1',
      holdId: HOLD_ID,
      paymentStatus: PaymentStatus.approved,
      totalCents: 6000,
      tickets: [
        { id: 'ticket-1', seatLabel: 'A1', kind: TicketKind.full },
        { id: 'ticket-2', seatLabel: 'A2', kind: TicketKind.half },
      ],
    });
    expect(result.paidAt).toEqual(expect.any(String));
  });

  it('declined não cria ticket vendido e libera os assentos', async () => {
    const result = await service.pay(CUSTOMER_ID, {
      holdId: HOLD_ID,
      result: PaymentStatus.declined,
    });

    const createdOrder = firstArg<{
      data: { paymentStatus: PaymentStatus; paidAt: Date | null };
    }>(prisma.order.create);
    expect(createdOrder.data).toMatchObject({
      paymentStatus: PaymentStatus.declined,
      paidAt: null,
    });
    expect(prisma.ticket.create).not.toHaveBeenCalled();
    expect(prisma.holdSeat.deleteMany).toHaveBeenCalledWith({
      where: { holdId: HOLD_ID },
    });
    expect(prisma.hold.update).toHaveBeenCalledWith({
      where: { id: HOLD_ID },
      data: { holdStatus: HoldStatus.converted },
    });
    expect(result).toMatchObject({
      paymentStatus: PaymentStatus.declined,
      paidAt: null,
      tickets: [],
    });
  });

  it('rejects a hold that already expired', async () => {
    prisma.hold.findUnique.mockResolvedValue(
      holdRow({
        holdStatus: HoldStatus.expired,
        expiresAt: addMs(NOW, -1000),
      }),
    );

    await expect(
      service.pay(CUSTOMER_ID, {
        holdId: HOLD_ID,
        result: PaymentStatus.approved,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('rejects a hold that belongs to another customer', async () => {
    await expect(
      service.pay(OTHER_ID, {
        holdId: HOLD_ID,
        result: PaymentStatus.approved,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('rejects a second pay on the same hold', async () => {
    prisma.hold.findUnique.mockResolvedValue(
      holdRow({
        holdStatus: HoldStatus.converted,
        order: { id: 'order-existing' },
      }),
    );

    await expect(
      service.pay(CUSTOMER_ID, {
        holdId: HOLD_ID,
        result: PaymentStatus.approved,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('maps a unique constraint on Order.holdId to a conflict', async () => {
    prisma.order.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.pay(CUSTOMER_ID, {
        holdId: HOLD_ID,
        result: PaymentStatus.approved,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
