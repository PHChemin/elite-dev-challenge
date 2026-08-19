import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PublishStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { toDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { SEAT_LABELS } from './events.constants';
import { ORGANIZER_EVENT_SELECT } from './events.select';
import { EventsService } from './events.service';

const ORGANIZER_ID = 'user-organizer';
const EXHIBITION_ID = 'exhibition-1';
const STARTS_AT = '2026-09-01T19:00:00.000Z';

describe('EventsService', () => {
  let service: EventsService;
  const prisma = {
    $transaction: jest.fn(),
    exhibition: {
      findUnique: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    seat: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prisma },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compile();
    service = module.get(EventsService);
  });

  describe('createMany', () => {
    beforeEach(() => {
      prisma.exhibition.findUnique.mockResolvedValue({
        id: EXHIBITION_ID,
        organizerId: ORGANIZER_ID,
      });
      prisma.event.findMany.mockResolvedValue([]);
    });

    it('fills priceHalf with floor(priceFull / 2) and generates the seats', async () => {
      prisma.event.create.mockResolvedValue({
        id: 'event-1',
        startsAt: toDate(STARTS_AT),
        venueName: 'Cine PHC',
        venueAddress: null,
        priceFull: 4001,
        priceHalf: 2000,
        maxTicketsPerOrder: 6,
        publishStatus: PublishStatus.published,
      });

      await service.createMany(ORGANIZER_ID, EXHIBITION_ID, [
        {
          startsAt: STARTS_AT,
          venueName: 'Cine PHC',
          priceFull: 4001,
        },
      ]);

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          exhibitionId: EXHIBITION_ID,
          startsAt: toDate(STARTS_AT),
          venueName: 'Cine PHC',
          venueAddress: null,
          priceFull: 4001,
          priceHalf: 2000,
          maxTicketsPerOrder: 6,
          publishStatus: PublishStatus.published,
        },
        select: ORGANIZER_EVENT_SELECT,
      });
      expect(prisma.seat.createMany).toHaveBeenCalledWith({
        data: SEAT_LABELS.map((label) => ({ eventId: 'event-1', label })),
      });
    });

    it('allows the same time at a different venue', async () => {
      prisma.event.create
        .mockResolvedValueOnce({ id: 'event-1' })
        .mockResolvedValueOnce({ id: 'event-2' });

      await service.createMany(ORGANIZER_ID, EXHIBITION_ID, [
        { startsAt: STARTS_AT, venueName: 'Cine PHC', priceFull: 4000 },
        { startsAt: STARTS_AT, venueName: 'Cine Centro', priceFull: 4000 },
      ]);

      expect(prisma.event.create).toHaveBeenCalledTimes(2);
    });

    it('rejects the same time at the same venue', async () => {
      await expect(
        service.createMany(ORGANIZER_ID, EXHIBITION_ID, [
          { startsAt: STARTS_AT, venueName: 'Cine PHC', priceFull: 4000 },
          { startsAt: STARTS_AT, venueName: 'Cine PHC', priceFull: 3500 },
        ]),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.event.create).not.toHaveBeenCalled();
    });

    it('rejects a schedule that already exists', async () => {
      prisma.event.findMany.mockResolvedValue([
        {
          startsAt: toDate(STARTS_AT),
          venueName: 'Cine PHC',
        },
      ]);

      await expect(
        service.createMany(ORGANIZER_ID, EXHIBITION_ID, [
          {
            startsAt: STARTS_AT,
            venueName: 'Cine PHC',
            priceFull: 4000,
          },
        ]),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.event.create).not.toHaveBeenCalled();
    });

    it('rejects an exhibition of another organizer', async () => {
      prisma.exhibition.findUnique.mockResolvedValue({
        id: EXHIBITION_ID,
        organizerId: 'user-other',
      });

      await expect(
        service.createMany(ORGANIZER_ID, EXHIBITION_ID, [
          {
            startsAt: STARTS_AT,
            venueName: 'Cine PHC',
            priceFull: 4000,
          },
        ]),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update', () => {
    const owned = {
      id: 'event-1',
      exhibitionId: EXHIBITION_ID,
      startsAt: toDate(STARTS_AT),
      venueName: 'Cine PHC',
      venueAddress: 'Rua A, 100',
      priceFull: 4000,
      priceHalf: 2000,
      maxTicketsPerOrder: 6,
      publishStatus: PublishStatus.draft,
      exhibition: { organizerId: ORGANIZER_ID },
    };

    it('recalculates priceHalf when priceFull changes without priceHalf', async () => {
      prisma.event.findUnique.mockResolvedValue(owned);
      prisma.event.update.mockResolvedValue(owned);

      await service.update(ORGANIZER_ID, 'event-1', { priceFull: 5001 });

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { priceFull: 5001, priceHalf: 2500 },
        select: ORGANIZER_EVENT_SELECT,
      });
    });

    it('publishes the event', async () => {
      prisma.event.findUnique.mockResolvedValue(owned);
      prisma.event.update.mockResolvedValue(owned);

      await service.update(ORGANIZER_ID, 'event-1', {
        publishStatus: PublishStatus.published,
      });

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { publishStatus: PublishStatus.published },
        select: ORGANIZER_EVENT_SELECT,
      });
    });
  });
});
