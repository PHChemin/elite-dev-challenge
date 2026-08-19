import { Prisma, PublishStatus } from '@prisma/client';
import {
  ORGANIZER_EVENT_SELECT,
  PUBLIC_EVENT_SELECT,
} from '../events/events.select';

export const EXHIBITION_METADATA_SELECT = {
  runtimeMinutes: true,
  overview: true,
  releaseDate: true,
  genres: true,
} satisfies Prisma.ExhibitionSelect;

export const PUBLIC_EXHIBITION_SELECT = {
  id: true,
  title: true,
  posterUrl: true,
  tmdbId: true,
  ...EXHIBITION_METADATA_SELECT,
} satisfies Prisma.ExhibitionSelect;

export const ORGANIZER_EXHIBITION_SELECT = {
  ...PUBLIC_EXHIBITION_SELECT,
  organizerId: true,
  publishStatus: true,
} satisfies Prisma.ExhibitionSelect;

export const PUBLIC_EXHIBITION_DETAIL_SELECT = {
  ...PUBLIC_EXHIBITION_SELECT,
  events: {
    where: { publishStatus: PublishStatus.published },
    orderBy: { startsAt: 'asc' as const },
    select: PUBLIC_EVENT_SELECT,
  },
} satisfies Prisma.ExhibitionSelect;

export const ORGANIZER_EXHIBITION_DETAIL_SELECT = {
  ...ORGANIZER_EXHIBITION_SELECT,
  events: {
    orderBy: { startsAt: 'asc' as const },
    select: ORGANIZER_EVENT_SELECT,
  },
} satisfies Prisma.ExhibitionSelect;
