import { Prisma } from '@prisma/client';
import { PUBLIC_EVENT_SELECT } from '../events/events.select';

const TICKET_EVENT_SELECT = {
  id: true,
  startsAt: true,
  venueName: true,
  venueAddress: true,
  exhibition: {
    select: {
      id: true,
      title: true,
      posterUrl: true,
    },
  },
} satisfies Prisma.EventSelect;

export const MINE_TICKET_SELECT = {
  id: true,
  kind: true,
  code: true,
  shareToken: true,
  usedAt: true,
  seat: { select: { label: true } },
  event: { select: TICKET_EVENT_SELECT },
} satisfies Prisma.TicketSelect;

export const SHARE_TICKET_SELECT = {
  kind: true,
  code: true,
  usedAt: true,
  seat: { select: { label: true } },
  event: { select: TICKET_EVENT_SELECT },
} satisfies Prisma.TicketSelect;
