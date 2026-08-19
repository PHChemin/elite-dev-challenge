import { Prisma } from '@prisma/client';
import { PUBLIC_EVENT_SELECT } from '../events/events.select';
import { SEAT_INCLUDE } from './reservations.constants';

export const HOLD_EVENT_SELECT = {
  ...PUBLIC_EVENT_SELECT,
  publishStatus: true,
  exhibition: {
    select: {
      id: true,
      title: true,
      posterUrl: true,
      publishStatus: true,
    },
  },
} satisfies Prisma.EventSelect;

export const HOLD_DETAIL_SELECT = {
  id: true,
  eventId: true,
  customerId: true,
  fullCount: true,
  halfCount: true,
  expiresAt: true,
  holdStatus: true,
  holdSeats: {
    select: {
      seat: { select: { label: true } },
    },
  },
  event: { select: HOLD_EVENT_SELECT },
} satisfies Prisma.HoldSelect;

export const OCCUPANCY_SEAT_SELECT = {
  id: true,
  label: true,
  ...SEAT_INCLUDE,
} satisfies Prisma.SeatSelect;
