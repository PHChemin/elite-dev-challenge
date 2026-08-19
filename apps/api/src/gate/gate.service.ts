import { ForbiddenException, Injectable } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { nowUtc, toIsoString } from '../common/dates';
import { paginateMeta } from '../common/pagination';
import {
  eventSaleState,
  type EventSaleState,
} from '../events/event-sale';
import { PrismaService } from '../prisma/prisma.service';
import type { GateScanDto } from './dto/gate-scan.dto';
import type { ListGateEventsQueryDto } from './dto/list-gate-events-query.dto';
import {
  GATE_EVENT_LIST_SELECT,
  GATE_EVENT_VERIFY_SELECT,
  GATE_SCAN_TICKET_SELECT,
} from './gate.select';

export type GateScanStatus =
  | 'valid'
  | 'invalid'
  | 'already_used'
  | 'wrong_event';

type GateScanResult = {
  status: GateScanStatus;
  seatLabel?: string;
  kind?: string;
};

type GateEventListItem = {
  id: string;
  startsAt: string;
  venueName: string;
  venueAddress: string | null;
  exhibition: {
    title: string;
    posterUrl: string | null;
    runtimeMinutes: number | null;
  };
  saleState: Exclude<EventSaleState, 'ended'>;
};

@Injectable()
export class GateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async listEvents(gateUserId: string, query: ListGateEventsQueryDto) {
    const organizerId = await this.requireOrganizerId(gateUserId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;

    const rows = await this.prisma.event.findMany({
      where: {
        publishStatus: PublishStatus.published,
        exhibition: {
          organizerId,
          publishStatus: PublishStatus.published,
        },
      },
      orderBy: { startsAt: 'asc' },
      select: GATE_EVENT_LIST_SELECT,
    });

    const now = nowUtc();
    const active = rows
      .map((row) => {
        const saleState = eventSaleState(
          row.startsAt,
          now,
          row.exhibition.runtimeMinutes,
        );
        if (saleState === 'ended') {
          return null;
        }
        return {
          id: row.id,
          startsAt: toIsoString(row.startsAt),
          venueName: row.venueName,
          venueAddress: row.venueAddress,
          exhibition: {
            title: row.exhibition.title,
            posterUrl: row.exhibition.posterUrl,
            runtimeMinutes: row.exhibition.runtimeMinutes,
          },
          saleState,
        } satisfies GateEventListItem;
      })
      .filter((row): row is GateEventListItem => row !== null);

    const { skip, totalPages } = paginateMeta(active.length, page, pageSize);
    const items = active.slice(skip, skip + pageSize);

    return {
      items,
      page,
      pageSize,
      total: active.length,
      totalPages,
    };
  }

  async scan(gateUserId: string, dto: GateScanDto): Promise<GateScanResult> {
    const organizerId = await this.requireOrganizerId(gateUserId);
    await this.assertEventOwnedByOrganizer(dto.eventId, organizerId);

    const ticket = await this.prisma.ticket.findFirst({
      where: { code: dto.code },
      select: GATE_SCAN_TICKET_SELECT,
    });

    if (!ticket || ticket.cancelledAt) {
      return { status: 'invalid' };
    }
    if (ticket.eventId !== dto.eventId) {
      return { status: 'wrong_event' };
    }
    if (ticket.usedAt) {
      return { status: 'already_used' };
    }

    const marked = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.updateMany({
        where: { id: ticket.id, usedAt: null },
        data: {
          usedAt: nowUtc(),
          validatedByUserId: gateUserId,
        },
      });
      return updated.count;
    });

    if (marked === 0) {
      return { status: 'already_used' };
    }

    return {
      status: 'valid',
      seatLabel: ticket.seat.label,
      kind: ticket.kind,
    };
  }

  private async requireOrganizerId(gateUserId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: gateUserId },
      select: { organizerId: true },
    });
    if (!user?.organizerId) {
      throw new ForbiddenException(this.i18n.t('gate.noOrganizer'));
    }
    return user.organizerId;
  }

  private async assertEventOwnedByOrganizer(
    eventId: string,
    organizerId: string,
  ): Promise<void> {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        publishStatus: PublishStatus.published,
        exhibition: { organizerId },
      },
      select: GATE_EVENT_VERIFY_SELECT,
    });
    if (!event) {
      throw new ForbiddenException(this.i18n.t('gate.eventNotAllowed'));
    }
  }
}
