import { HoldStatus } from '@prisma/client';
import { isAfter } from '../common/dates';

export type SeatOccupancy = 'free' | 'held_by_me' | 'taken';

export type OccupancyHold = {
  id: string;
  customerId: string;
  holdStatus: HoldStatus;
  expiresAt: Date;
};

export type OccupancySeat = {
  id: string;
  label: string;
  ticket: { id: string; cancelledAt: Date | null } | null;
  holdSeat: { hold: OccupancyHold } | null;
};

export function isHoldActive(
  hold: Pick<OccupancyHold, 'holdStatus' | 'expiresAt'>,
  now: Date,
): boolean {
  return hold.holdStatus === HoldStatus.active && isAfter(hold.expiresAt, now);
}

export function seatOccupancy(
  seat: OccupancySeat,
  now: Date,
  viewerId?: string,
): SeatOccupancy {
  if (seat.ticket && seat.ticket.cancelledAt === null) {
    return 'taken';
  }
  const hold = seat.holdSeat?.hold;
  if (!hold || !isHoldActive(hold, now)) {
    return 'free';
  }
  if (viewerId && hold.customerId === viewerId) {
    return 'held_by_me';
  }
  return 'taken';
}

export function isSeatAvailable(
  seat: OccupancySeat,
  now: Date,
  viewerId?: string,
): boolean {
  const occupancy = seatOccupancy(seat, now, viewerId);
  return occupancy === 'free' || occupancy === 'held_by_me';
}

export function countFreeSeats(
  seats: OccupancySeat[],
  now: Date,
  viewerId?: string,
): number {
  return seats.filter((seat) => isSeatAvailable(seat, now, viewerId)).length;
}
