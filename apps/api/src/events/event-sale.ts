import { addMs, isAfter } from '../common/dates';
import { STARTS_SOON_MS } from './events.constants';

export function hasEventStarted(startsAt: Date, now: Date): boolean {
  return !isAfter(startsAt, now);
}

export function isEventStartingSoon(startsAt: Date, now: Date): boolean {
  return (
    isAfter(startsAt, now) && !isAfter(startsAt, addMs(now, STARTS_SOON_MS))
  );
}
