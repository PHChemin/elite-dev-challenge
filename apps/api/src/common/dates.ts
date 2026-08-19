import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function toDate(value: string | number | Date): Date {
  return dayjs.utc(value).toDate();
}

export function nowUtc(): Date {
  return dayjs.utc().toDate();
}

export function toIsoString(value?: string | number | Date): string {
  return (value === undefined ? dayjs.utc() : dayjs.utc(value)).toISOString();
}

export function addMs(value: string | number | Date, ms: number): Date {
  return dayjs.utc(value).add(ms, 'millisecond').toDate();
}

export function isAfter(
  left: string | number | Date,
  right: string | number | Date,
): boolean {
  return dayjs.utc(left).isAfter(dayjs.utc(right));
}
