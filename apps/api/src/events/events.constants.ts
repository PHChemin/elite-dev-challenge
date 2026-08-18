import { toIsoString } from '../common/dates';

export const DEFAULT_MAX_TICKETS_PER_ORDER = 6;

export const MAX_TICKETS_PER_ORDER_LIMIT = 20;

export const MAX_EVENTS_PER_REQUEST = 62;

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

const SEATS_PER_ROW = 12;

export const SEAT_LABELS: string[] = SEAT_ROWS.flatMap((row) =>
  Array.from({ length: SEATS_PER_ROW }, (_, index) => `${row}${index + 1}`),
);

export function eventScheduleKey(startsAt: Date, venueName: string): string {
  return `${toIsoString(startsAt)}|${venueName.trim()}`;
}
