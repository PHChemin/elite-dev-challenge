import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PublishStatus, TicketKind } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { addMs, toDate } from '../common/dates';
import { eventSaleState } from '../events/event-sale';
import { PrismaService } from '../prisma/prisma.service';
import * as dates from '../common/dates';
import { GateService } from './gate.service';

const NOW = toDate('2026-09-01T19:00:00.000Z');
const GATE_USER_ID = 'user-gate';
const ORGANIZER_ID = 'user-organizer';
const EVENT_ID = 'event-1';
const OTHER_EVENT_ID = 'event-2';
const TICKET_ID = 'ticket-1';
const TICKET_CODE = 'a'.repeat(32);

const exhibition = {
  title: 'Clube da Luta',
  posterUrl: null,
  runtimeMinutes: 139,
  organizerId: ORGANIZER_ID,
};

const activeEvent = {
  id: EVENT_ID,
  startsAt: NOW,
  venueName: 'Cine PHC',
  venueAddress: 'Rua A, 100',
  publishStatus: PublishStatus.published,
  exhibition,
};

function ticketRow(extra?: {
  usedAt?: Date | null;
  cancelledAt?: Date | null;
  eventId?: string;
}) {
  return {
    id: TICKET_ID,
    eventId: extra?.eventId ?? EVENT_ID,
    usedAt: extra?.usedAt ?? null,
    cancelledAt: extra?.cancelledAt ?? null,
    kind: TicketKind.full,
    seat: { label: 'A1' },
  };
}

describe('GateService', () => {
  let service: GateService;
  const prisma = {
    user: { findUnique: jest.fn() },
    event: { findMany: jest.fn(), findFirst: jest.fn() },
    ticket: { findFirst: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(
      (work: (tx: typeof prisma) => unknown) => work(prisma),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(dates, 'nowUtc').mockReturnValue(NOW);

    prisma.user.findUnique.mockResolvedValue({
      id: GATE_USER_ID,
      organizerId: ORGANIZER_ID,
    });
    prisma.event.findFirst.mockResolvedValue(activeEvent);
    prisma.ticket.findFirst.mockResolvedValue(ticketRow());
    prisma.ticket.updateMany.mockResolvedValue({ count: 1 });
    prisma.event.findMany.mockResolvedValue([activeEvent]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GateService,
        { provide: PrismaService, useValue: prisma },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compile();
    service = module.get(GateService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('scan', () => {
    it('returns valid and marks ticket used', async () => {
      const result = await service.scan(GATE_USER_ID, {
        eventId: EVENT_ID,
        code: TICKET_CODE,
      });

      expect(result).toEqual({
        status: 'valid',
        seatLabel: 'A1',
        kind: TicketKind.full,
      });
      expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
        where: { id: TICKET_ID, usedAt: null },
        data: { usedAt: NOW, validatedByUserId: GATE_USER_ID },
      });
    });

    it('returns invalid for unknown code', async () => {
      prisma.ticket.findFirst.mockResolvedValue(null);

      const result = await service.scan(GATE_USER_ID, {
        eventId: EVENT_ID,
        code: 'missing',
      });

      expect(result).toEqual({ status: 'invalid' });
      expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('returns wrong_event when ticket belongs to another session', async () => {
      prisma.ticket.findFirst.mockResolvedValue(
        ticketRow({ eventId: OTHER_EVENT_ID }),
      );

      const result = await service.scan(GATE_USER_ID, {
        eventId: EVENT_ID,
        code: TICKET_CODE,
      });

      expect(result).toEqual({ status: 'wrong_event' });
    });

    it('returns already_used when ticket was scanned before', async () => {
      prisma.ticket.findFirst.mockResolvedValue(
        ticketRow({ usedAt: addMs(NOW, -60_000) }),
      );

      const result = await service.scan(GATE_USER_ID, {
        eventId: EVENT_ID,
        code: TICKET_CODE,
      });

      expect(result).toEqual({ status: 'already_used' });
    });

    it('returns already_used when updateMany races', async () => {
      prisma.ticket.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.scan(GATE_USER_ID, {
        eventId: EVENT_ID,
        code: TICKET_CODE,
      });

      expect(result).toEqual({ status: 'already_used' });
    });

    it('returns invalid for cancelled ticket', async () => {
      prisma.ticket.findFirst.mockResolvedValue(
        ticketRow({ cancelledAt: NOW }),
      );

      const result = await service.scan(GATE_USER_ID, {
        eventId: EVENT_ID,
        code: TICKET_CODE,
      });

      expect(result).toEqual({ status: 'invalid' });
    });

    it('rejects gate user without organizerId', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: GATE_USER_ID,
        organizerId: null,
      });

      await expect(
        service.scan(GATE_USER_ID, { eventId: EVENT_ID, code: TICKET_CODE }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects scan on event from another organizer', async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(
        service.scan(GATE_USER_ID, { eventId: EVENT_ID, code: TICKET_CODE }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('listEvents', () => {
    it('returns only non-ended sessions ordered by startsAt asc', async () => {
      const ended = {
        ...activeEvent,
        id: 'event-ended',
        startsAt: addMs(NOW, -4 * 60 * 60 * 1000),
      };
      const upcoming = {
        ...activeEvent,
        id: 'event-upcoming',
        startsAt: addMs(NOW, 2 * 60 * 60 * 1000),
      };
      prisma.event.findMany.mockResolvedValue([ended, activeEvent, upcoming]);

      const result = await service.listEvents(GATE_USER_ID, {
        page: 1,
        pageSize: 12,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((row) => row.id)).toEqual([
        activeEvent.id,
        upcoming.id,
      ]);
      expect(result.items[0]?.saleState).toBe(
        eventSaleState(activeEvent.startsAt, NOW, exhibition.runtimeMinutes),
      );
    });

    it('rejects gate user without organizerId', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: GATE_USER_ID,
        organizerId: null,
      });

      await expect(
        service.listEvents(GATE_USER_ID, { page: 1, pageSize: 12 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
