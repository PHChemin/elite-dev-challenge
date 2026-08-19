import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { CatalogService } from '../catalog/catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateExhibitionDto } from './dto/create-exhibition.dto';
import type { UpdateExhibitionDto } from './dto/update-exhibition.dto';
import {
  ORGANIZER_EXHIBITION_DETAIL_SELECT,
  ORGANIZER_EXHIBITION_SELECT,
  PUBLIC_EXHIBITION_DETAIL_SELECT,
  PUBLIC_EXHIBITION_SELECT,
} from './exhibitions.select';

type ExhibitionListRow = Prisma.ExhibitionGetPayload<{
  select: typeof PUBLIC_EXHIBITION_SELECT & {
    events: { select: { startsAt: true } };
  };
}> & {
  tmdbId?: string;
  organizerId?: string;
  publishStatus?: PublishStatus;
};

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

@Injectable()
export class ExhibitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly i18n: I18nService,
  ) {}

  async listPublished() {
    const rows = await this.prisma.exhibition.findMany({
      where: { publishStatus: PublishStatus.published },
      orderBy: { title: 'asc' },
      select: {
        ...PUBLIC_EXHIBITION_SELECT,
        events: {
          where: { publishStatus: PublishStatus.published },
          orderBy: { startsAt: 'asc' },
          select: { startsAt: true },
        },
      },
    });
    return rows.map((row) => toListItem(row, false));
  }

  async findPublished(id: string) {
    const exhibition = await this.prisma.exhibition.findFirst({
      where: { id, publishStatus: PublishStatus.published },
      select: PUBLIC_EXHIBITION_DETAIL_SELECT,
    });
    if (!exhibition) {
      throw new NotFoundException(this.i18n.t('exhibitions.notFound'));
    }
    return {
      id: exhibition.id,
      tmdbId: exhibition.tmdbId,
      title: exhibition.title,
      posterUrl: exhibition.posterUrl,
      events: exhibition.events,
    };
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
    try {
      return await this.prisma.exhibition.create({
        data: {
          organizerId,
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterUrl: movie.posterUrl,
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
      data.tmdbId = movie.tmdbId;
      data.title = movie.title;
      data.posterUrl = movie.posterUrl;
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
