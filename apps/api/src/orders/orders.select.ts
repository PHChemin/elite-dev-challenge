import { Prisma } from '@prisma/client';

export const PAY_HOLD_SELECT = {
  id: true,
  eventId: true,
  customerId: true,
  fullCount: true,
  halfCount: true,
  expiresAt: true,
  holdStatus: true,
  order: { select: { id: true } },
  holdSeats: {
    select: {
      seat: { select: { id: true, label: true } },
    },
  },
  event: {
    select: {
      id: true,
      priceFull: true,
      priceHalf: true,
    },
  },
} satisfies Prisma.HoldSelect;
