import dayjs from 'dayjs';

const STARTS_SOON_MINUTES = 60;

export type EventSaleState = 'open' | 'starts_soon' | 'started';

export function eventSaleState(startsAt: string): EventSaleState {
  const start = dayjs(startsAt);
  const now = dayjs();
  if (!start.isAfter(now)) {
    return 'started';
  }
  if (start.diff(now, 'minute') <= STARTS_SOON_MINUTES) {
    return 'starts_soon';
  }
  return 'open';
}

export function canBuyEvent(startsAt: string): boolean {
  return eventSaleState(startsAt) !== 'started';
}
