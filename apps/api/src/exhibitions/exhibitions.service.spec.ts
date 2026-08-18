import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PublishStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { CatalogService } from '../catalog/catalog.service';
import { toDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { ORGANIZER_EXHIBITION_SELECT } from './exhibitions.select';
import { ExhibitionsService } from './exhibitions.service';

const ORGANIZER_ID = 'user-organizer';
const STARTS_AT = '2026-09-01T19:00:00.000Z';

const fightClub = {
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  releaseDate: '1999-10-15',
};

const exhibition = {
  id: 'exhibition-1',
  organizerId: ORGANIZER_ID,
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: fightClub.posterUrl,
  publishStatus: PublishStatus.published,
};

describe('ExhibitionsService', () => {
  let service: ExhibitionsService;
  const prisma = {
    exhibition: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: {
      count: jest.fn(),
    },
  };
  const catalog = {
    getMovie: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExhibitionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CatalogService, useValue: catalog },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compile();
    service = module.get(ExhibitionsService);
  });

  describe('listPublished', () => {
    it('lists published exhibitions even without published events', async () => {
      prisma.exhibition.findMany.mockResolvedValue([
        { ...exhibition, events: [] },
      ]);

      await expect(service.listPublished()).resolves.toEqual([
        {
          id: exhibition.id,
          title: exhibition.title,
          posterUrl: exhibition.posterUrl,
          nextStartsAt: null,
          eventCount: 0,
        },
      ]);
      expect(catalog.getMovie).not.toHaveBeenCalled();
    });
  });

  describe('findPublished', () => {
    it('returns published events only', async () => {
      const event = {
        id: 'event-1',
        startsAt: toDate(STARTS_AT),
        venueName: 'Cine PHC',
        venueAddress: 'Rua A, 100',
        priceFull: 4000,
        priceHalf: 2000,
        maxTicketsPerOrder: 6,
      };
      prisma.exhibition.findFirst.mockResolvedValue({
        ...exhibition,
        events: [event],
      });

      await expect(service.findPublished('exhibition-1')).resolves.toEqual({
        id: exhibition.id,
        title: exhibition.title,
        posterUrl: exhibition.posterUrl,
        tmdbId: exhibition.tmdbId,
        events: [event],
      });
    });

    it('hides a draft exhibition', async () => {
      prisma.exhibition.findFirst.mockResolvedValue(null);

      await expect(service.findPublished('draft')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates a draft exhibition from the catalog', async () => {
      catalog.getMovie.mockResolvedValue(fightClub);
      prisma.exhibition.create.mockResolvedValue({
        ...exhibition,
        publishStatus: PublishStatus.draft,
      });

      await expect(
        service.create(ORGANIZER_ID, { tmdbId: '550' }),
      ).resolves.toMatchObject({ tmdbId: '550', title: 'Clube da Luta' });
      expect(prisma.exhibition.create).toHaveBeenCalledWith({
        data: {
          organizerId: ORGANIZER_ID,
          tmdbId: '550',
          title: 'Clube da Luta',
          posterUrl: fightClub.posterUrl,
        },
        select: ORGANIZER_EXHIBITION_SELECT,
      });
    });
  });

  describe('update', () => {
    it('publishes the exhibition', async () => {
      prisma.exhibition.findUnique.mockResolvedValue({
        ...exhibition,
        publishStatus: PublishStatus.draft,
        events: [],
      });
      prisma.exhibition.update.mockResolvedValue(exhibition);

      await service.update(ORGANIZER_ID, 'exhibition-1', {
        publishStatus: PublishStatus.published,
      });

      expect(prisma.exhibition.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { publishStatus: PublishStatus.published },
        }),
      );
    });

    it('rejects changing the movie when the exhibition has events', async () => {
      prisma.exhibition.findUnique.mockResolvedValue({
        ...exhibition,
        events: [{ startsAt: toDate(STARTS_AT) }],
      });
      prisma.event.count.mockResolvedValue(1);

      await expect(
        service.update(ORGANIZER_ID, 'exhibition-1', { tmdbId: '603' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(catalog.getMovie).not.toHaveBeenCalled();
    });

    it('rejects an exhibition of another organizer', async () => {
      prisma.exhibition.findUnique.mockResolvedValue({
        ...exhibition,
        organizerId: 'user-other',
        events: [],
      });

      await expect(
        service.update(ORGANIZER_ID, 'exhibition-1', {
          publishStatus: PublishStatus.published,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
