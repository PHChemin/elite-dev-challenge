import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TicketKind } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { toDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';

const CUSTOMER_ID = 'user-customer';
const OTHER_ID = 'user-other';
const STARTS_AT = toDate('2026-09-01T19:00:00.000Z');

const exhibition = {
  id: 'exhibition-1',
  title: 'Clube da Luta',
  posterUrl: null,
};

const event = {
  id: 'event-1',
  startsAt: STARTS_AT,
  venueName: 'Cine PHC',
  venueAddress: 'Rua A, 100',
  exhibition,
};

function ticketRow(extra: {
  id?: string;
  customerId?: string;
  shareToken?: string;
  cancelledAt?: Date | null;
}) {
  return {
    id: extra.id ?? 'ticket-1',
    kind: TicketKind.full,
    code: 'a'.repeat(32),
    shareToken: extra.shareToken ?? 'share-token-a',
    usedAt: null,
    cancelledAt: extra.cancelledAt ?? null,
    customerId: extra.customerId ?? CUSTOMER_ID,
    seat: { label: 'A1' },
    event,
  };
}

describe('TicketsService', () => {
  let service: TicketsService;
  const prisma = {
    ticket: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.ticket.findMany.mockResolvedValue([
      ticketRow({ id: 'ticket-1' }),
      ticketRow({ id: 'ticket-2', shareToken: 'share-token-b' }),
    ]);
    prisma.ticket.findFirst.mockResolvedValue(ticketRow({ shareToken: 'public-token' }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: prisma },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compile();
    service = module.get(TicketsService);
  });

  it('lists only the owner tickets with session and qr payload', async () => {
    const result = await service.listMine(CUSTOMER_ID);

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: CUSTOMER_ID, cancelledAt: null },
      }),
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'ticket-1',
      code: 'a'.repeat(32),
      shareToken: 'share-token-a',
      seatLabel: 'A1',
      event: {
        id: 'event-1',
        venueName: 'Cine PHC',
      },
      exhibition: {
        id: 'exhibition-1',
        title: 'Clube da Luta',
      },
    });
    expect(result[0].event.startsAt).toBe(STARTS_AT.toISOString());
  });

  it('returns a public share view without owner-only fields', async () => {
    const result = await service.findByShareToken('public-token');

    expect(result).toMatchObject({
      kind: TicketKind.full,
      code: 'a'.repeat(32),
      seatLabel: 'A1',
      exhibition: { title: 'Clube da Luta' },
    });
    expect(result).not.toHaveProperty('shareToken');
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('customerId');
  });

  it('rejects an unknown share token', async () => {
    prisma.ticket.findFirst.mockResolvedValue(null);

    await expect(service.findByShareToken('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('scopes listMine to the authenticated customer id', async () => {
    prisma.ticket.findMany.mockResolvedValue([]);

    await service.listMine(OTHER_ID);

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: OTHER_ID, cancelledAt: null },
      }),
    );
  });
});
