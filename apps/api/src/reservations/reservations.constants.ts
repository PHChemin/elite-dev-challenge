export const HOLD_TTL_MS = 10 * 60 * 1000;

export const HOLD_CLEANUP_INTERVAL_MS = 60 * 1000;

export const SEAT_INCLUDE = {
  ticket: { select: { id: true, cancelledAt: true } },
  holdSeat: {
    select: {
      hold: {
        select: {
          id: true,
          customerId: true,
          holdStatus: true,
          expiresAt: true,
        },
      },
    },
  },
} as const;
