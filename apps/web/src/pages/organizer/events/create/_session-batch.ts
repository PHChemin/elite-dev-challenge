import type { CreateEventItemPayload } from '@/api/types';
import {
  combineDateAndTime,
  daysInRange,
  fromDateTimeLocalValue,
  reaisToCents,
} from '@/utils/format';
import { toNumber } from '@/utils/number';
import { MAX_EVENTS_PER_REQUEST, MAX_SESSION_MODELS } from '@/utils/tickets';

export type SessionMode = 'manual' | 'daily';

export type SessionModelValues = {
  startsAt: string;
  time: string;
  venueName: string;
  venueAddress: string;
  priceFull: number | string;
  priceHalf: number | string;
  maxTicketsPerOrder: number | string;
};

export type BatchFormValues = {
  mode: SessionMode;
  periodFrom: string;
  periodTo: string;
  quantity: number;
  sameVenue: boolean;
  sharedVenueName: string;
  sharedVenueAddress: string;
  samePrice: boolean;
  sharedPriceFull: number | string;
  sharedPriceHalf: number | string;
  models: SessionModelValues[];
};

export function maxModelsForPeriod(from: string, to: string): number {
  const days = daysInRange(from, to).length;
  if (days === 0) {
    return MAX_SESSION_MODELS;
  }
  return Math.min(
    MAX_SESSION_MODELS,
    Math.max(1, Math.floor(MAX_EVENTS_PER_REQUEST / days)),
  );
}

export function resizeModels(
  models: SessionModelValues[],
  quantity: number,
  maxTicketsPerOrder: number,
): SessionModelValues[] {
  const next = Math.min(MAX_SESSION_MODELS, Math.max(1, quantity));
  if (next > models.length) {
    return [
      ...models,
      ...Array.from({ length: next - models.length }, () =>
        emptySessionModel(maxTicketsPerOrder),
      ),
    ];
  }
  return models.slice(0, next);
}

export function emptySessionModel(
  maxTicketsPerOrder: number,
): SessionModelValues {
  return {
    startsAt: '',
    time: '',
    venueName: '',
    venueAddress: '',
    priceFull: '',
    priceHalf: '',
    maxTicketsPerOrder,
  };
}

export function previewEventCount(values: BatchFormValues): number {
  if (values.mode === 'manual') {
    return values.models.length;
  }
  return daysInRange(values.periodFrom, values.periodTo).length * values.models.length;
}

function venueOf(
  values: BatchFormValues,
  model: SessionModelValues,
): { venueName: string; venueAddress: string } {
  if (values.mode === 'daily' && values.sameVenue) {
    return {
      venueName: values.sharedVenueName.trim(),
      venueAddress: values.sharedVenueAddress.trim(),
    };
  }
  return {
    venueName: model.venueName.trim(),
    venueAddress: model.venueAddress.trim(),
  };
}

function priceOf(
  values: BatchFormValues,
  model: SessionModelValues,
): { priceFull: number | string; priceHalf: number | string } {
  if (values.mode === 'daily' && values.samePrice) {
    return {
      priceFull: values.sharedPriceFull,
      priceHalf: values.sharedPriceHalf,
    };
  }
  return { priceFull: model.priceFull, priceHalf: model.priceHalf };
}

function toPayload(
  startsAt: string,
  venueName: string,
  venueAddress: string,
  priceFullValue: number | string,
  priceHalfValue: number | string,
  maxTicketsPerOrder: number | string,
): CreateEventItemPayload | { error: 'price' | 'venue' | 'startsAt' } {
  if (!startsAt) {
    return { error: 'startsAt' };
  }
  if (!venueName) {
    return { error: 'venue' };
  }
  const priceFull = toNumber(priceFullValue);
  if (priceFull === null || reaisToCents(priceFull) < 1) {
    return { error: 'price' };
  }
  const priceHalf = toNumber(priceHalfValue);
  const cap = toNumber(maxTicketsPerOrder);
  const payload: CreateEventItemPayload = {
    startsAt,
    venueName,
    venueAddress: venueAddress.length > 0 ? venueAddress : undefined,
    priceFull: reaisToCents(priceFull),
  };
  if (priceHalf !== null) {
    payload.priceHalf = reaisToCents(priceHalf);
  }
  if (cap !== null) {
    payload.maxTicketsPerOrder = cap;
  }
  return payload;
}

export type ExpandSessionResult =
  | { ok: true; events: CreateEventItemPayload[] }
  | { ok: false; reason: ExpandSessionFailure };

export type ExpandSessionFailure =
  | 'period'
  | 'time'
  | 'startsAt'
  | 'venue'
  | 'price'
  | 'limit'
  | 'duplicate';

export function expandSessionModels(
  values: BatchFormValues,
): ExpandSessionResult {
  if (values.mode === 'daily') {
    const days = daysInRange(values.periodFrom, values.periodTo);
    if (days.length === 0) {
      return { ok: false, reason: 'period' };
    }
    if (days.length * values.models.length > MAX_EVENTS_PER_REQUEST) {
      return { ok: false, reason: 'limit' };
    }
    const events: CreateEventItemPayload[] = [];
    for (const day of days) {
      for (const model of values.models) {
        if (!model.time) {
          return { ok: false, reason: 'time' };
        }
        const venue = venueOf(values, model);
        const price = priceOf(values, model);
        const payload = toPayload(
          combineDateAndTime(day, model.time),
          venue.venueName,
          venue.venueAddress,
          price.priceFull,
          price.priceHalf,
          model.maxTicketsPerOrder,
        );
        if ('error' in payload) {
          return { ok: false, reason: payload.error };
        }
        events.push(payload);
      }
    }
    if (hasScheduleClash(events)) {
      return { ok: false, reason: 'duplicate' };
    }
    return { ok: true, events };
  }

  if (values.models.length > MAX_EVENTS_PER_REQUEST) {
    return { ok: false, reason: 'limit' };
  }
  const events: CreateEventItemPayload[] = [];
  for (const model of values.models) {
    const venue = venueOf(values, model);
    const price = priceOf(values, model);
    const payload = toPayload(
      model.startsAt ? fromDateTimeLocalValue(model.startsAt) : '',
      venue.venueName,
      venue.venueAddress,
      price.priceFull,
      price.priceHalf,
      model.maxTicketsPerOrder,
    );
    if ('error' in payload) {
      return { ok: false, reason: payload.error };
    }
    events.push(payload);
  }
  if (hasScheduleClash(events)) {
    return { ok: false, reason: 'duplicate' };
  }
  return { ok: true, events };
}

function hasScheduleClash(events: CreateEventItemPayload[]): boolean {
  const seen = new Set<string>();
  for (const event of events) {
    const key = `${event.startsAt}|${event.venueName}`;
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }
  return false;
}
