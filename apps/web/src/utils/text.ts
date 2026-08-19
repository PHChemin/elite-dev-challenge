import type { TFunction } from 'i18next';

export function formatEventCount(count: number, t: TFunction): string {
  if (count === 0) {
    return t('exhibitions.eventCountNone');
  }
  if (count === 1) {
    return t('exhibitions.eventCountOne');
  }
  return t('exhibitions.eventCountMany', { count });
}
