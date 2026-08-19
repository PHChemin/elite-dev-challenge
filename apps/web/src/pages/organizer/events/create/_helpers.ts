import type { TFunction } from 'i18next';
import { daysInRange, reaisToCents } from '@/utils/format';
import { toNumber } from '@/utils/number';
import { MAX_EVENTS_PER_REQUEST } from '@/utils/tickets';
import type { BatchFormValues, ExpandEventFailure } from './_event-batch';

export function expandFailureMessage(
  reason: ExpandEventFailure,
  t: TFunction,
): string {
  switch (reason) {
    case 'limit':
      return t('events.batch.limit', { max: MAX_EVENTS_PER_REQUEST });
    case 'duplicate':
      return t('events.batch.duplicate');
    case 'period':
      return t('validation.period.required');
    case 'time':
      return t('validation.time.required');
    case 'startsAt':
      return t('validation.startsAt.invalid');
    case 'venue':
      return t('validation.venueName.required');
    case 'price':
      return t('validation.priceFull.invalid');
  }
}

export function batchFormValidate(t: TFunction) {
  return {
    periodFrom: (value: string, values: BatchFormValues) =>
      values.mode === 'daily' && value.length === 0
        ? t('validation.period.required')
        : null,
    periodTo: (value: string, values: BatchFormValues) => {
      if (values.mode !== 'daily') {
        return null;
      }
      if (value.length === 0) {
        return t('validation.period.required');
      }
      return daysInRange(values.periodFrom, value).length > 0
        ? null
        : t('validation.period.invalid');
    },
    sharedVenueName: (value: string, values: BatchFormValues) =>
      values.mode === 'daily' && values.sameVenue && value.trim().length === 0
        ? t('validation.venueName.required')
        : null,
    sharedPriceFull: (value: number | string, values: BatchFormValues) => {
      if (values.mode !== 'daily' || !values.samePrice) {
        return null;
      }
      const reais = toNumber(value);
      return reais !== null && reaisToCents(reais) >= 1
        ? null
        : t('validation.priceFull.invalid');
    },
    models: {
      startsAt: (value: string, values: BatchFormValues) =>
        values.mode === 'manual' && String(value).length === 0
          ? t('validation.startsAt.invalid')
          : null,
      time: (value: string, values: BatchFormValues) =>
        values.mode === 'daily' && String(value).length === 0
          ? t('validation.time.required')
          : null,
      venueName: (value: string, values: BatchFormValues) => {
        if (values.mode === 'daily' && values.sameVenue) {
          return null;
        }
        return String(value).trim().length > 0
          ? null
          : t('validation.venueName.required');
      },
      priceFull: (value: number | string, values: BatchFormValues) => {
        if (values.mode === 'daily' && values.samePrice) {
          return null;
        }
        const reais = toNumber(value);
        return reais !== null && reaisToCents(reais) >= 1
          ? null
          : t('validation.priceFull.invalid');
      },
    },
  };
}
