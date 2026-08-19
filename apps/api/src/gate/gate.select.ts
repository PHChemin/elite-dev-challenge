import { Prisma, PublishStatus } from '@prisma/client';

export const GATE_EVENT_LIST_SELECT = {
  id: true,
  startsAt: true,
  venueName: true,
  venueAddress: true,
  exhibition: {
    select: {
      title: true,
      posterUrl: true,
      runtimeMinutes: true,
      organizerId: true,
    },
  },
} satisfies Prisma.EventSelect;

export const GATE_SCAN_TICKET_SELECT = {
  id: true,
  eventId: true,
  usedAt: true,
  cancelledAt: true,
  kind: true,
  seat: { select: { label: true } },
} satisfies Prisma.TicketSelect;

export const GATE_EVENT_VERIFY_SELECT = {
  id: true,
  publishStatus: true,
  exhibition: { select: { organizerId: true } },
} satisfies Prisma.EventSelect;

export const publishedEventFilter = {
  publishStatus: PublishStatus.published,
} as const;
