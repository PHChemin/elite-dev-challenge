const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

const SEATS_PER_ROW = 12;

/** Must match apps/api/src/events/events.constants.ts (8×12 layout). */
export const SEAT_LABELS: string[] = SEAT_ROWS.flatMap((row) =>
  Array.from({ length: SEATS_PER_ROW }, (_, index) => `${row}${index + 1}`),
);
