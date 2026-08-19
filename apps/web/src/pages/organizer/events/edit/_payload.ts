import type { UpdateEventPayload } from '@/api/types';
import { fromDateTimeLocalValue, reaisToCents } from '@/utils/format';
import { toNumber } from '@/utils/number';

export type EventFormValues = {
  startsAt: string;
  venueName: string;
  venueAddress: string;
  priceFull: number | string;
  priceHalf: number | string;
  maxTicketsPerOrder: number | string;
};

export function toUpdateEventPayload(
  values: EventFormValues,
): UpdateEventPayload {
  const priceFull = toNumber(values.priceFull);
  const priceHalf = toNumber(values.priceHalf);
  const cap = toNumber(values.maxTicketsPerOrder);
  const payload: UpdateEventPayload = {
    startsAt: fromDateTimeLocalValue(values.startsAt),
    venueName: values.venueName.trim(),
    venueAddress: values.venueAddress.trim(),
    priceFull: reaisToCents(priceFull ?? 0),
  };
  if (priceHalf !== null) {
    payload.priceHalf = reaisToCents(priceHalf);
  }
  if (cap !== null) {
    payload.maxTicketsPerOrder = cap;
  }
  return payload;
}
