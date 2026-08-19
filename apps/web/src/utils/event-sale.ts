import dayjs from 'dayjs';

const STARTS_SOON_MINUTES = 60;

export type EventSaleState = 'open' | 'starts_soon' | 'in_progress' | 'ended';

export function eventSaleState(
  startsAt: string,
  runtimeMinutes?: number | null,
): EventSaleState {
  const start = dayjs(startsAt);
  const now = dayjs();
  if (start.isAfter(now)) {
    if (start.diff(now, 'minute') <= STARTS_SOON_MINUTES) {
      return 'starts_soon';
    }
    return 'open';
  }

  if (typeof runtimeMinutes === 'number' && runtimeMinutes > 0) {
    const end = start.add(runtimeMinutes, 'minute');
    if (now.isBefore(end)) {
      return 'in_progress';
    }
    return 'ended';
  }

  return 'ended';
}

export function canBuyEvent(startsAt: string): boolean {
  return dayjs(startsAt).isAfter(dayjs());
}
