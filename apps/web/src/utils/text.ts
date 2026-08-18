import type { TFunction } from 'i18next';

export function formatSessionCount(count: number, t: TFunction): string {
  if (count === 0) {
    return t('exhibitions.sessionCountNone');
  }
  if (count === 1) {
    return t('exhibitions.sessionCountOne');
  }
  return t('exhibitions.sessionCountMany', { count });
}
