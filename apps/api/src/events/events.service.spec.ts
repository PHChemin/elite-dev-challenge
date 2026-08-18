import { Test, TestingModule } from '@nestjs/testing';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';

const publishedSession = {
  id: 'event-1',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  startsAt: new Date('2026-09-01T19:00:00.000Z'),
  venueName: 'Cine PHC',
  venueAddress: 'Rua A, 100',
  priceFull: 4000,
  priceHalf: 2000,
  maxTicketsPerOrder: 6,
};

describe('EventsService', () => {
  let service: EventsService;
  const prisma = {
    event: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    prisma.event.findMany.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(EventsService);
  });

  it('lists published sessions from the database without TMDb', async () => {
    prisma.event.findMany.mockResolvedValue([publishedSession]);

    await expect(service.listPublished()).resolves.toEqual([publishedSession]);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { publishStatus: PublishStatus.published },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        title: true,
        posterUrl: true,
        startsAt: true,
        venueName: true,
        venueAddress: true,
        priceFull: true,
        priceHalf: true,
        maxTicketsPerOrder: true,
      },
    });
  });

  it('returns an empty list when no published session exists', async () => {
    prisma.event.findMany.mockResolvedValue([]);

    await expect(service.listPublished()).resolves.toEqual([]);
  });
});
