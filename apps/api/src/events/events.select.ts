import { Prisma } from '@prisma/client';

export const PUBLIC_EVENT_SELECT = {
  id: true,
  startsAt: true,
  venueName: true,
  venueAddress: true,
  priceFull: true,
  priceHalf: true,
  maxTicketsPerOrder: true,
} satisfies Prisma.EventSelect;

export const ORGANIZER_EVENT_SELECT = {
  ...PUBLIC_EVENT_SELECT,
  publishStatus: true,
} satisfies Prisma.EventSelect;
