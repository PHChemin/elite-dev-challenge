import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { toIsoString } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { MINE_TICKET_SELECT, SHARE_TICKET_SELECT } from './tickets.select';

type MineTicketRow = Prisma.TicketGetPayload<{
  select: typeof MINE_TICKET_SELECT;
}>;

type ShareTicketRow = Prisma.TicketGetPayload<{
  select: typeof SHARE_TICKET_SELECT;
}>;

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async listMine(customerId: string) {
    const rows = await this.prisma.ticket.findMany({
      where: { customerId, cancelledAt: null },
      select: MINE_TICKET_SELECT,
      orderBy: [{ event: { startsAt: 'desc' } }, { seat: { label: 'asc' } }],
    });
    return rows.map((row) => this.toMineItem(row));
  }

  async findByShareToken(shareToken: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { shareToken, cancelledAt: null },
      select: SHARE_TICKET_SELECT,
    });
    if (!ticket) {
      throw new NotFoundException(this.i18n.t('tickets.notFound'));
    }
    return this.toShareItem(ticket);
  }

  private toMineItem(row: MineTicketRow) {
    return {
      id: row.id,
      kind: row.kind,
      code: row.code,
      shareToken: row.shareToken,
      usedAt: row.usedAt ? toIsoString(row.usedAt) : null,
      seatLabel: row.seat.label,
      event: this.toEventSlice(row.event),
      exhibition: {
        id: row.event.exhibition.id,
        title: row.event.exhibition.title,
        posterUrl: row.event.exhibition.posterUrl,
      },
    };
  }

  private toShareItem(row: ShareTicketRow) {
    return {
      kind: row.kind,
      code: row.code,
      usedAt: row.usedAt ? toIsoString(row.usedAt) : null,
      seatLabel: row.seat.label,
      event: this.toEventSlice(row.event),
      exhibition: {
        id: row.event.exhibition.id,
        title: row.event.exhibition.title,
        posterUrl: row.event.exhibition.posterUrl,
      },
    };
  }

  private toEventSlice(
    event: MineTicketRow['event'] | ShareTicketRow['event'],
  ) {
    return {
      id: event.id,
      startsAt: toIsoString(event.startsAt),
      venueName: event.venueName,
      venueAddress: event.venueAddress,
    };
  }
}
