import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/pt-br';

dayjs.extend(localizedFormat);
dayjs.locale('pt-br');

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCents(cents: number): string {
  return money.format(cents / 100);
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).format('L LT');
}

export function formatLongDateTime(iso: string): string {
  return dayjs(iso).format('LLLL');
}

export function centsToReais(cents: number): number {
  return cents / 100;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

export function formatDate(iso: string): string {
  return dayjs(iso).format('L');
}

export function formatTime(iso: string): string {
  return dayjs(iso).format('LT');
}

export function daysInRange(from: string, to: string): string[] {
  const start = dayjs(from).startOf('day');
  const end = dayjs(to).startOf('day');
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
    return [];
  }
  const days: string[] = [];
  for (let day = start; !day.isAfter(end); day = day.add(1, 'day')) {
    days.push(day.format('YYYY-MM-DD'));
  }
  return days;
}

export function combineDateAndTime(date: string, time: string): string {
  return dayjs(`${date}T${time}`).toISOString();
}

export function toDateTimeLocalValue(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DDTHH:mm');
}

export function fromDateTimeLocalValue(value: string): string {
  return dayjs(value).toISOString();
}

export function calendarDayKey(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD');
}

export function weekdayShort(iso: string): string {
  return dayjs(iso).format('ddd').replaceAll('.', '').toUpperCase();
}

export function dayAndMonth(iso: string): string {
  return dayjs(iso).format('DD/MM');
}

export function isToday(iso: string): boolean {
  return dayjs(iso).isSame(dayjs(), 'day');
}

export type SessionDay = {
  key: string;
  sampleIso: string;
};

export function dayOptionsFromStartsAt(startsAtList: string[]): SessionDay[] {
  const seen = new Map<string, string>();
  for (const iso of startsAtList) {
    const key = calendarDayKey(iso);
    if (!seen.has(key)) {
      seen.set(key, iso);
    }
  }
  return [...seen.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, sampleIso]) => ({ key, sampleIso }));
}

export function defaultDayKey(days: SessionDay[]): string {
  const today = dayjs().format('YYYY-MM-DD');
  return days.find((day) => day.key >= today)?.key ?? days[0]?.key ?? '';
}
