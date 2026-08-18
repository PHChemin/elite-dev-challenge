import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function toDate(value: string | number | Date): Date {
  return dayjs.utc(value).toDate();
}

export function toIsoString(value?: string | number | Date): string {
  return (value === undefined ? dayjs.utc() : dayjs.utc(value)).toISOString();
}
