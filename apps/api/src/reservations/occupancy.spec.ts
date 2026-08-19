import { HoldStatus } from '@prisma/client';
import { addMs, toDate } from '../common/dates';
import {
  countFreeSeats,
  isHoldActive,
  isSeatAvailable,
  seatOccupancy,
  type OccupancySeat,
} from './occupancy';

const NOW = toDate('2026-09-01T19:00:00.000Z');
const FUTURE = addMs(NOW, 10 * 60 * 1000);
const PAST = addMs(NOW, -10 * 60 * 1000);

function seat(overrides: Partial<OccupancySeat> = {}): OccupancySeat {
  return {
    id: 'seat-1',
    label: 'A1',
    ticket: null,
    holdSeat: null,
    ...overrides,
  };
}

describe('occupancy', () => {
  it('treats an active hold in the future as blocking', () => {
    expect(
      isHoldActive({ holdStatus: HoldStatus.active, expiresAt: FUTURE }, NOW),
    ).toBe(true);
  });

  it('treats an expired timestamp as free even if status is still active', () => {
    expect(
      isHoldActive({ holdStatus: HoldStatus.active, expiresAt: PAST }, NOW),
    ).toBe(false);
  });

  it('marks a sold seat as taken', () => {
    expect(
      seatOccupancy(
        seat({ ticket: { id: 't1', cancelledAt: null } }),
        NOW,
        'user-customer',
      ),
    ).toBe('taken');
  });

  it('marks the viewer hold as held_by_me and still available for a new hold', () => {
    const owned = seat({
      holdSeat: {
        hold: {
          id: 'h1',
          customerId: 'user-customer',
          holdStatus: HoldStatus.active,
          expiresAt: FUTURE,
        },
      },
    });
    expect(seatOccupancy(owned, NOW, 'user-customer')).toBe('held_by_me');
    expect(isSeatAvailable(owned, NOW, 'user-customer')).toBe(true);
  });

  it('marks another customer hold as taken', () => {
    const other = seat({
      holdSeat: {
        hold: {
          id: 'h2',
          customerId: 'user-other',
          holdStatus: HoldStatus.active,
          expiresAt: FUTURE,
        },
      },
    });
    expect(seatOccupancy(other, NOW, 'user-customer')).toBe('taken');
    expect(isSeatAvailable(other, NOW, 'user-customer')).toBe(false);
  });

  it('counts own held seats as free for the viewer', () => {
    const seats = [
      seat({ id: '1', label: 'A1' }),
      seat({
        id: '2',
        label: 'A2',
        holdSeat: {
          hold: {
            id: 'h1',
            customerId: 'user-customer',
            holdStatus: HoldStatus.active,
            expiresAt: FUTURE,
          },
        },
      }),
      seat({
        id: '3',
        label: 'A3',
        ticket: { id: 't1', cancelledAt: null },
      }),
    ];
    expect(countFreeSeats(seats, NOW, 'user-customer')).toBe(2);
    expect(countFreeSeats(seats, NOW)).toBe(1);
  });
});
