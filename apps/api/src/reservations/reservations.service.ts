import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HoldStatus, Prisma, PublishStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { addMs, nowUtc, toIsoString } from '../common/dates';
import { hasEventStarted } from '../events/event-sale';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateHoldDto } from './dto/create-hold.dto';
import {
  countFreeSeats,
  isHoldActive,
  isSeatAvailable,
  seatOccupancy,
  type OccupancySeat,
} from './occupancy';
import { HOLD_TTL_MS } from './reservations.constants';
import {
  HOLD_DETAIL_SELECT,
  HOLD_EVENT_SELECT,
  OCCUPANCY_SEAT_SELECT,
} from './reservations.select';

type HoldDetail = Prisma.HoldGetPayload<{ select: typeof HOLD_DETAIL_SELECT }>;
type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findPublishedEvent(id: string, customerId?: string) {
    await this.releaseExpired(this.prisma, id);
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: HOLD_EVENT_SELECT,
    });
    this.assertPublicEvent(event);
    const seats = await this.loadSeats(this.prisma, id);
    const now = nowUtc();
    return {
      id: event.id,
      startsAt: event.startsAt,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      priceFull: event.priceFull,
      priceHalf: event.priceHalf,
      maxTicketsPerOrder: event.maxTicketsPerOrder,
      exhibition: {
        id: event.exhibition.id,
        title: event.exhibition.title,
        posterUrl: event.exhibition.posterUrl,
      },
      freeSeatCount: countFreeSeats(seats, now, customerId),
    };
  }

  async listSeats(eventId: string, customerId: string) {
    await this.releaseExpired(this.prisma, eventId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: HOLD_EVENT_SELECT,
    });
    this.assertPublicEvent(event);
    const now = nowUtc();
    const seats = await this.loadSeats(this.prisma, eventId);
    const mine = seats.find(
      (seat) => seatOccupancy(seat, now, customerId) === 'held_by_me',
    );
    const myHold = mine?.holdSeat?.hold
      ? {
          id: mine.holdSeat.hold.id,
          expiresAt: toIsoString(mine.holdSeat.hold.expiresAt),
        }
      : null;
    return {
      myHold,
      seats: seats
        .slice()
        .sort((left, right) => left.label.localeCompare(right.label, 'en'))
        .map((seat) => ({
          label: seat.label,
          status: seatOccupancy(seat, now, customerId),
        })),
    };
  }

  async createHold(customerId: string, dto: CreateHoldDto) {
    const quantity = dto.fullCount + dto.halfCount;
    if (quantity < 1 || quantity !== dto.seatLabels.length) {
      throw new BadRequestException({
        message: this.i18n.t('reservations.quantityMismatch'),
        fieldErrors: {
          seatLabels: [this.i18n.t('reservations.quantityMismatch')],
        },
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.releaseExpired(tx, dto.eventId);
        const event = await tx.event.findUnique({
          where: { id: dto.eventId },
          select: HOLD_EVENT_SELECT,
        });
        this.assertPublicEvent(event);
        if (hasEventStarted(event.startsAt, nowUtc())) {
          throw new BadRequestException(
            this.i18n.t('reservations.eventStarted'),
          );
        }
        if (quantity > event.maxTicketsPerOrder) {
          throw new BadRequestException({
            message: this.i18n.t('reservations.capExceeded'),
            fieldErrors: {
              fullCount: [this.i18n.t('reservations.capExceeded')],
            },
          });
        }

        await this.cancelOwnActiveHold(tx, customerId, dto.eventId);
        const seats = await this.loadSeats(tx, dto.eventId);
        const now = nowUtc();
        const freeSeatCount = countFreeSeats(seats, now, customerId);
        if (quantity > freeSeatCount) {
          throw new ConflictException(
            this.i18n.t('reservations.notEnoughSeats', {
              args: { count: String(freeSeatCount) },
            }),
          );
        }

        const byLabel = new Map(seats.map((seat) => [seat.label, seat]));
        const requested: OccupancySeat[] = [];
        for (const label of dto.seatLabels) {
          const seat = byLabel.get(label);
          if (!seat) {
            throw new BadRequestException({
              message: this.i18n.t('reservations.unknownSeats'),
              fieldErrors: {
                seatLabels: [this.i18n.t('reservations.unknownSeats')],
              },
            });
          }
          if (!isSeatAvailable(seat, now, customerId)) {
            throw new ConflictException(
              this.i18n.t('reservations.seatConflict'),
            );
          }
          requested.push(seat);
        }

        const created = await tx.hold.create({
          data: {
            customerId,
            eventId: dto.eventId,
            fullCount: dto.fullCount,
            halfCount: dto.halfCount,
            expiresAt: addMs(now, HOLD_TTL_MS),
          },
          select: { id: true },
        });
        await tx.holdSeat.createMany({
          data: requested.map((seat) => ({
            holdId: created.id,
            seatId: seat.id,
          })),
        });
        const hold = await tx.hold.findUnique({
          where: { id: created.id },
          select: HOLD_DETAIL_SELECT,
        });
        if (!hold) {
          throw new NotFoundException(this.i18n.t('reservations.notFound'));
        }
        return this.toHoldResponse(hold);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(this.i18n.t('reservations.seatConflict'));
      }
      throw error;
    }
  }

  async findMine(customerId: string, holdId: string) {
    await this.releaseExpired(this.prisma);
    const hold = await this.prisma.hold.findUnique({
      where: { id: holdId },
      select: HOLD_DETAIL_SELECT,
    });
    if (!hold) {
      throw new NotFoundException(this.i18n.t('reservations.notFound'));
    }
    if (hold.customerId !== customerId) {
      throw new ForbiddenException(this.i18n.t('reservations.notOwner'));
    }
    if (!isHoldActive(hold, nowUtc())) {
      throw new NotFoundException(this.i18n.t('reservations.notFound'));
    }
    return this.toHoldResponse(hold);
  }

  async listMineHolds(customerId: string) {
    await this.releaseExpired(this.prisma);
    const holds = await this.prisma.hold.findMany({
      where: {
        customerId,
        holdStatus: HoldStatus.active,
        expiresAt: { gt: nowUtc() },
        order: null,
      },
      select: HOLD_DETAIL_SELECT,
      orderBy: { expiresAt: 'asc' },
    });
    return holds.map((hold) => this.toHoldResponse(hold));
  }

  async releaseExpired(client: DbClient = this.prisma, eventId?: string) {
    const expired = await client.hold.findMany({
      where: {
        holdStatus: HoldStatus.active,
        expiresAt: { lte: nowUtc() },
        ...(eventId ? { eventId } : {}),
      },
      select: { id: true },
    });
    if (expired.length === 0) {
      return;
    }
    const ids = expired.map((row) => row.id);
    await client.holdSeat.deleteMany({ where: { holdId: { in: ids } } });
    await client.hold.updateMany({
      where: { id: { in: ids } },
      data: { holdStatus: HoldStatus.expired },
    });
  }

  private async cancelOwnActiveHold(
    tx: Prisma.TransactionClient,
    customerId: string,
    eventId: string,
  ) {
    const current = await tx.hold.findFirst({
      where: {
        customerId,
        eventId,
        holdStatus: HoldStatus.active,
        expiresAt: { gt: nowUtc() },
      },
      select: { id: true },
    });
    if (!current) {
      return;
    }
    await tx.holdSeat.deleteMany({ where: { holdId: current.id } });
    await tx.hold.update({
      where: { id: current.id },
      data: { holdStatus: HoldStatus.cancelled },
    });
  }

  private async loadSeats(client: DbClient, eventId: string) {
    return client.seat.findMany({
      where: { eventId },
      select: OCCUPANCY_SEAT_SELECT,
    });
  }

  private assertPublicEvent(
    event: Prisma.EventGetPayload<{ select: typeof HOLD_EVENT_SELECT }> | null,
  ): asserts event is Prisma.EventGetPayload<{
    select: typeof HOLD_EVENT_SELECT;
  }> {
    if (
      !event ||
      event.publishStatus !== PublishStatus.published ||
      event.exhibition.publishStatus !== PublishStatus.published
    ) {
      throw new NotFoundException(this.i18n.t('events.notFound'));
    }
  }

  private toHoldResponse(hold: HoldDetail) {
    return {
      id: hold.id,
      eventId: hold.eventId,
      fullCount: hold.fullCount,
      halfCount: hold.halfCount,
      expiresAt: toIsoString(hold.expiresAt),
      seatLabels: hold.holdSeats.map((row) => row.seat.label),
      event: {
        id: hold.event.id,
        startsAt: hold.event.startsAt,
        venueName: hold.event.venueName,
        venueAddress: hold.event.venueAddress,
        priceFull: hold.event.priceFull,
        priceHalf: hold.event.priceHalf,
        maxTicketsPerOrder: hold.event.maxTicketsPerOrder,
      },
      exhibition: {
        id: hold.event.exhibition.id,
        title: hold.event.exhibition.title,
        posterUrl: hold.event.exhibition.posterUrl,
      },
    };
  }
}
