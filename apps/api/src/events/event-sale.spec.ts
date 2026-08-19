import { addMs, toDate } from '../common/dates';
import { STARTS_SOON_MS } from './events.constants';
import { hasEventStarted, isEventStartingSoon } from './event-sale';

const NOW = toDate('2026-09-01T19:00:00.000Z');

describe('event-sale', () => {
  it('treats a future start as not started', () => {
    expect(hasEventStarted(addMs(NOW, STARTS_SOON_MS), NOW)).toBe(false);
  });

  it('treats start time as already started', () => {
    expect(hasEventStarted(NOW, NOW)).toBe(true);
  });

  it('flags an event in the next hour as starting soon', () => {
    expect(isEventStartingSoon(addMs(NOW, 30 * 60 * 1000), NOW)).toBe(true);
    expect(isEventStartingSoon(addMs(NOW, 2 * STARTS_SOON_MS), NOW)).toBe(
      false,
    );
  });
});
