import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { CatalogService } from '../catalog/catalog.service';
import type { CatalogGenre } from '../catalog/catalog.types';
import { paginateMeta } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateExhibitionDto } from './dto/create-exhibition.dto';
import type { ListPublishedQueryDto } from './dto/list-published-query.dto';
import type { UpdateExhibitionDto } from './dto/update-exhibition.dto';
import {
  ORGANIZER_EXHIBITION_DETAIL_SELECT,
  ORGANIZER_EXHIBITION_SELECT,
  PUBLIC_EXHIBITION_DETAIL_SELECT,
  PUBLIC_EXHIBITION_SELECT,
} from './exhibitions.select';
import type { PaginatedExhibitions } from './exhibitions.types';

type ExhibitionListRow = Prisma.ExhibitionGetPayload<{
  select: typeof PUBLIC_EXHIBITION_SELECT & {
    events: { select: { startsAt: true } };
  };
}> & {
  tmdbId?: string;
  organizerId?: string;
  publishStatus?: PublishStatus;
};

const publishedEventFilter = {
  some: { publishStatus: PublishStatus.published },
} satisfies Prisma.EventListRelationFilter;

function toListItem(row: ExhibitionListRow, withOrganizer: boolean) {
  const base = {
    id: row.id,
    title: row.title,
    posterUrl: row.posterUrl,
    nextStartsAt: row.events[0]?.startsAt ?? null,
    eventCount: row.events.length,
  };
  if (!withOrganizer) {
    return base;
  }
  return {
    ...base,
    tmdbId: row.tmdbId,
    organizerId: row.organizerId,
    publishStatus: row.publishStatus,
  };
}

function toPublicDetail(exhibition: {
  id: string;
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  runtimeMinutes: number | null;
  overview: string | null;
  releaseDate: string | null;
  genres: unknown;
  events: unknown[];
}) {
  return {
    id: exhibition.id,
    tmdbId: exhibition.tmdbId,
    title: exhibition.title,
    posterUrl: exhibition.posterUrl,
    runtimeMinutes: exhibition.runtimeMinutes,
    overview: exhibition.overview,
    releaseDate: exhibition.releaseDate,
    genres: parseGenres(exhibition.genres),
    events: exhibition.events,
  };
}

function parseGenres(value: unknown): CatalogGenre[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (row): row is CatalogGenre =>
      typeof row === 'object' &&
      row !== null &&
      typeof (row as CatalogGenre).id === 'number' &&
      typeof (row as CatalogGenre).name === 'string',
  );
}

@Injectable()
export class ExhibitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly i18n: I18nService,
  ) {}

  async listPublished(
    query: ListPublishedQueryDto,
  ): Promise<PaginatedExhibitions> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const where: Prisma.ExhibitionWhereInput = {
      publishStatus: PublishStatus.published,
      events: publishedEventFilter,
    };
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }

    const total = await this.prisma.exhibition.count({ where });
    const { skip, totalPages } = paginateMeta(total, page, pageSize);

    const rows = await this.prisma.exhibition.findMany({
      where,
      orderBy: { title: 'asc' },
      skip,
      take: pageSize,
      select: {
        ...PUBLIC_EXHIBITION_SELECT,
        events: {
          where: { publishStatus: PublishStatus.published },
          orderBy: { startsAt: 'asc' },
          select: { startsAt: true },
        },
      },
    });

    return {
      items: rows.map((row) => toListItem(row, false)),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  async findPublished(id: string) {
    const exhibition = await this.prisma.exhibition.findFirst({
      where: { id, publishStatus: PublishStatus.published },
      select: PUBLIC_EXHIBITION_DETAIL_SELECT,
    });
    if (!exhibition) {
      throw new NotFoundException(this.i18n.t('exhibitions.notFound'));
    }
    return toPublicDetail(exhibition);
  }

  async listByOrganizer(organizerId: string) {
    const rows = await this.prisma.exhibition.findMany({
      where: { organizerId },
      orderBy: { title: 'asc' },
      select: {
        ...ORGANIZER_EXHIBITION_SELECT,
        events: {
          orderBy: { startsAt: 'asc' },
          select: { startsAt: true },
        },
      },
    });
    return rows.map((row) => toListItem(row, true));
  }

  async findByOrganizer(organizerId: string, id: string) {
    return this.loadOwned(organizerId, id);
  }

  async create(organizerId: string, dto: CreateExhibitionDto) {
    const movie = await this.catalog.getMovie(dto.tmdbId);
    const metadata = this.catalog.toExhibitionMetadata(movie);
    try {
      return await this.prisma.exhibition.create({
        data: {
          organizerId,
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterUrl: movie.posterUrl,
          ...metadata,
          genres: metadata.genres,
        },
        select: ORGANIZER_EXHIBITION_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(this.i18n.t('exhibitions.duplicateMovie'));
      }
      throw error;
    }
  }

  async update(organizerId: string, id: string, dto: UpdateExhibitionDto) {
    await this.loadOwned(organizerId, id);
    const data: Prisma.ExhibitionUpdateInput = {};

    if (dto.tmdbId !== undefined) {
      const eventCount = await this.prisma.event.count({
        where: { exhibitionId: id },
      });
      if (eventCount > 0) {
        throw new ConflictException(this.i18n.t('exhibitions.hasEvents'));
      }
      const movie = await this.catalog.getMovie(dto.tmdbId);
      const metadata = this.catalog.toExhibitionMetadata(movie);
      data.tmdbId = movie.tmdbId;
      data.title = movie.title;
      data.posterUrl = movie.posterUrl;
      data.runtimeMinutes = metadata.runtimeMinutes;
      data.overview = metadata.overview;
      data.releaseDate = metadata.releaseDate;
      data.genres = metadata.genres;
    }
    if (dto.publishStatus !== undefined) {
      data.publishStatus = dto.publishStatus;
    }

    try {
      return await this.prisma.exhibition.update({
        where: { id },
        data,
        select: ORGANIZER_EXHIBITION_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(this.i18n.t('exhibitions.duplicateMovie'));
      }
      throw error;
    }
  }

  private async loadOwned(organizerId: string, id: string) {
    const exhibition = await this.prisma.exhibition.findUnique({
      where: { id },
      select: ORGANIZER_EXHIBITION_DETAIL_SELECT,
    });
    if (!exhibition) {
      throw new NotFoundException(this.i18n.t('exhibitions.notFound'));
    }
    if (exhibition.organizerId !== organizerId) {
      throw new ForbiddenException(this.i18n.t('exhibitions.notOwner'));
    }
    return exhibition;
  }
}
