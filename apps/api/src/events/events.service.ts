import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { toDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEventItemDto } from './dto/create-events.dto';
import type { UpdateEventDto } from './dto/update-event.dto';
import {
  DEFAULT_MAX_TICKETS_PER_ORDER,
  SEAT_LABELS,
  eventScheduleKey,
} from './events.constants';
import { ORGANIZER_EVENT_SELECT } from './events.select';

function halfOf(priceFull: number): number {
  return Math.floor(priceFull / 2);
}

function normalizeAddress(value: string | undefined): string | null {
  return value === undefined || value === '' ? null : value;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async createMany(
    organizerId: string,
    exhibitionId: string,
    items: CreateEventItemDto[],
  ) {
    await this.assertExhibitionOwner(organizerId, exhibitionId);

    const incoming = items.map((item) => ({
      startsAt: toDate(item.startsAt),
      venueName: item.venueName,
      venueAddress: normalizeAddress(item.venueAddress),
      priceFull: item.priceFull,
      priceHalf: item.priceHalf ?? halfOf(item.priceFull),
      maxTicketsPerOrder:
        item.maxTicketsPerOrder ?? DEFAULT_MAX_TICKETS_PER_ORDER,
    }));

    const payloadKeys = incoming.map((row) =>
      eventScheduleKey(row.startsAt, row.venueName),
    );
    if (new Set(payloadKeys).size !== payloadKeys.length) {
      throw new ConflictException(this.i18n.t('events.scheduleConflict'));
    }

    const existing = await this.prisma.event.findMany({
      where: { exhibitionId },
      select: { startsAt: true, venueName: true },
    });
    const taken = new Set(
      existing.map((row) => eventScheduleKey(row.startsAt, row.venueName)),
    );
    if (payloadKeys.some((key) => taken.has(key))) {
      throw new ConflictException(this.i18n.t('events.scheduleConflict'));
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created: Prisma.EventGetPayload<{
          select: typeof ORGANIZER_EVENT_SELECT;
        }>[] = [];
        for (const row of incoming) {
          const event = await tx.event.create({
            data: {
              exhibitionId,
              startsAt: row.startsAt,
              venueName: row.venueName,
              venueAddress: row.venueAddress,
              priceFull: row.priceFull,
              priceHalf: row.priceHalf,
              maxTicketsPerOrder: row.maxTicketsPerOrder,
              publishStatus: PublishStatus.published,
            },
            select: ORGANIZER_EVENT_SELECT,
          });
          await tx.seat.createMany({
            data: SEAT_LABELS.map((label) => ({ eventId: event.id, label })),
          });
          created.push(event);
        }
        return created;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(this.i18n.t('events.scheduleConflict'));
      }
      throw error;
    }
  }

  async update(organizerId: string, id: string, dto: UpdateEventDto) {
    const current = await this.loadOwned(organizerId, id);
    const nextStartsAt =
      dto.startsAt !== undefined ? toDate(dto.startsAt) : current.startsAt;
    const nextVenue =
      dto.venueName !== undefined ? dto.venueName : current.venueName;

    if (
      eventScheduleKey(nextStartsAt, nextVenue) !==
      eventScheduleKey(current.startsAt, current.venueName)
    ) {
      const clash = await this.prisma.event.findFirst({
        where: {
          exhibitionId: current.exhibitionId,
          startsAt: nextStartsAt,
          venueName: nextVenue,
          NOT: { id },
        },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException(this.i18n.t('events.scheduleConflict'));
      }
    }

    const data: Prisma.EventUpdateInput = {};
    if (dto.startsAt !== undefined) {
      data.startsAt = nextStartsAt;
    }
    if (dto.venueName !== undefined) {
      data.venueName = dto.venueName;
    }
    if (dto.venueAddress !== undefined) {
      data.venueAddress = normalizeAddress(dto.venueAddress);
    }
    if (dto.priceFull !== undefined) {
      data.priceFull = dto.priceFull;
    }
    if (dto.priceHalf !== undefined) {
      data.priceHalf = dto.priceHalf;
    } else if (dto.priceFull !== undefined) {
      data.priceHalf = halfOf(dto.priceFull);
    }
    if (dto.maxTicketsPerOrder !== undefined) {
      data.maxTicketsPerOrder = dto.maxTicketsPerOrder;
    }
    if (dto.publishStatus !== undefined) {
      data.publishStatus = dto.publishStatus;
    }

    try {
      return await this.prisma.event.update({
        where: { id },
        data,
        select: ORGANIZER_EVENT_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(this.i18n.t('events.scheduleConflict'));
      }
      throw error;
    }
  }

  private async assertExhibitionOwner(
    organizerId: string,
    exhibitionId: string,
  ) {
    const exhibition = await this.prisma.exhibition.findUnique({
      where: { id: exhibitionId },
      select: { id: true, organizerId: true },
    });
    if (!exhibition) {
      throw new NotFoundException(this.i18n.t('exhibitions.notFound'));
    }
    if (exhibition.organizerId !== organizerId) {
      throw new ForbiddenException(this.i18n.t('exhibitions.notOwner'));
    }
    return exhibition;
  }

  private async loadOwned(organizerId: string, id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: {
        ...ORGANIZER_EVENT_SELECT,
        exhibitionId: true,
        exhibition: { select: { organizerId: true } },
      },
    });
    if (!event) {
      throw new NotFoundException(this.i18n.t('events.notFound'));
    }
    if (event.exhibition.organizerId !== organizerId) {
      throw new ForbiddenException(this.i18n.t('events.notOwner'));
    }
    return event;
  }
}
