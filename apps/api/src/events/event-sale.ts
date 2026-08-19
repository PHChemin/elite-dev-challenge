import { addMs, isAfter } from '../common/dates';
import { STARTS_SOON_MS } from './events.constants';

export type EventSaleState = 'open' | 'starts_soon' | 'in_progress' | 'ended';

export function hasEventStarted(startsAt: Date, now: Date): boolean {
  return !isAfter(startsAt, now);
}

export function isEventStartingSoon(startsAt: Date, now: Date): boolean {
  return (
    isAfter(startsAt, now) && !isAfter(startsAt, addMs(now, STARTS_SOON_MS))
  );
}

export function eventSaleState(
  startsAt: Date,
  now: Date,
  runtimeMinutes?: number | null,
): EventSaleState {
  if (isAfter(startsAt, now)) {
    if (isEventStartingSoon(startsAt, now)) {
      return 'starts_soon';
    }
    return 'open';
  }

  if (
    typeof runtimeMinutes === 'number' &&
    runtimeMinutes > 0 &&
    isAfter(addMs(startsAt, runtimeMinutes * 60_000), now)
  ) {
    return 'in_progress';
  }

  return 'ended';
}

export function canBuyEvent(startsAt: Date, now: Date): boolean {
  return isAfter(startsAt, now);
}
