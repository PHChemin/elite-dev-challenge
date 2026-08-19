import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HoldStatus, PaymentStatus, Prisma, TicketKind } from '@prisma/client';
import { randomBytes } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { nowUtc, toIsoString } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { isHoldActive } from '../reservations/occupancy';
import { ReservationsService } from '../reservations/reservations.service';
import type { PayOrderDto } from './dto/pay-order.dto';
import { PAY_HOLD_SELECT } from './orders.select';

type PayHold = Prisma.HoldGetPayload<{ select: typeof PAY_HOLD_SELECT }>;
type DbClient = Prisma.TransactionClient | PrismaService;

type IssuedTicket = {
  id: string;
  seatLabel: string;
  kind: TicketKind;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
    private readonly i18n: I18nService,
  ) {}

  async pay(customerId: string, dto: PayOrderDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.reservations.releaseExpired(tx);
        const hold = await tx.hold.findUnique({
          where: { id: dto.holdId },
          select: PAY_HOLD_SELECT,
        });
        if (!hold) {
          throw new NotFoundException(this.i18n.t('reservations.notFound'));
        }
        if (hold.customerId !== customerId) {
          throw new ForbiddenException(this.i18n.t('reservations.notOwner'));
        }
        if (hold.order) {
          throw new ConflictException(this.i18n.t('orders.alreadyPaid'));
        }
        if (!isHoldActive(hold, nowUtc())) {
          throw new NotFoundException(this.i18n.t('reservations.notFound'));
        }

        const totalCents =
          hold.fullCount * hold.event.priceFull +
          hold.halfCount * hold.event.priceHalf;
        const approved = dto.result === PaymentStatus.approved;
        const paidAt = approved ? nowUtc() : null;

        const order = await tx.order.create({
          data: {
            customerId,
            holdId: hold.id,
            paymentStatus: dto.result,
            totalCents,
            paidAt,
          },
          select: { id: true },
        });

        const tickets = approved
          ? await this.issueTickets(tx, hold, order.id, customerId)
          : [];

        await tx.holdSeat.deleteMany({ where: { holdId: hold.id } });
        await tx.hold.update({
          where: { id: hold.id },
          data: { holdStatus: HoldStatus.converted },
        });

        return {
          id: order.id,
          holdId: hold.id,
          paymentStatus: dto.result,
          totalCents,
          paidAt: paidAt ? toIsoString(paidAt) : null,
          tickets,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(this.i18n.t('orders.alreadyPaid'));
      }
      throw error;
    }
  }

  private async issueTickets(
    tx: DbClient,
    hold: PayHold,
    orderId: string,
    customerId: string,
  ): Promise<IssuedTicket[]> {
    const seats = hold.holdSeats
      .map((row) => row.seat)
      .sort((left, right) => left.label.localeCompare(right.label, 'en'));

    const tickets: IssuedTicket[] = [];
    for (const [index, seat] of seats.entries()) {
      const kind = index < hold.fullCount ? TicketKind.full : TicketKind.half;
      const created = await tx.ticket.create({
        data: {
          orderId,
          eventId: hold.eventId,
          seatId: seat.id,
          customerId,
          kind,
          code: opaqueToken(),
          shareToken: opaqueToken(),
        },
        select: {
          id: true,
          kind: true,
          seat: { select: { label: true } },
        },
      });
      tickets.push({
        id: created.id,
        seatLabel: created.seat.label,
        kind: created.kind,
      });
    }
    return tickets;
  }
}

function opaqueToken(): string {
  return randomBytes(16).toString('hex');
}
