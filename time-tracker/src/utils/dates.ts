import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subWeeks,
  parseISO,
  isValid,
} from 'date-fns';
import { da } from 'date-fns/locale';
import type { DateRange, PeriodKey } from '../types';

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDisplay(isoDate: string): string {
  try {
    const d = parseISO(isoDate);
    if (!isValid(d)) return isoDate;
    return format(d, 'dd. MMM yyyy', { locale: da });
  } catch {
    return isoDate;
  }
}

export function formatDayName(isoDate: string): string {
  try {
    const d = parseISO(isoDate);
    if (!isValid(d)) return '';
    return format(d, 'EEEE', { locale: da });
  } catch {
    return '';
  }
}

export function formatShortDay(isoDate: string): string {
  try {
    const d = parseISO(isoDate);
    if (!isValid(d)) return '';
    return format(d, 'EEE dd/MM', { locale: da });
  } catch {
    return '';
  }
}

export function currentWeekRange(): DateRange {
  const now = new Date();
  const from = startOfWeek(now, { weekStartsOn: 1 });
  const to = endOfWeek(now, { weekStartsOn: 1 });
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}

export function periodToDateRange(period: PeriodKey): DateRange {
  const now = new Date();
  switch (period) {
    case '1uge':
      return currentWeekRange();
    case '1måned': {
      const from = startOfMonth(now);
      const to = endOfMonth(now);
      return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
    }
    case '3måneder': {
      const from = subMonths(now, 3);
      return { from: format(from, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
    }
    case '6måneder': {
      const from = subMonths(now, 6);
      return { from: format(from, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
    }
    case '12måneder': {
      const from = subMonths(now, 12);
      return { from: format(from, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
    }
    default:
      return currentWeekRange();
  }
}

/** Get all ISO dates in a range (Mon–Fri only) */
export function getWeekdaysInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from + 'T12:00:00');
  const end = new Date(to + 'T12:00:00');
  while (current <= end) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      dates.push(format(current, 'yyyy-MM-dd'));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Get all ISO dates in a range */
export function getDatesInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from + 'T12:00:00');
  const end = new Date(to + 'T12:00:00');
  while (current <= end) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** ISO week number for a date */
export function isoWeek(isoDate: string): string {
  try {
    const d = parseISO(isoDate);
    return format(d, "yyyy-'W'ww");
  } catch {
    return isoDate;
  }
}

export function getMonday(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const mon = startOfWeek(d, { weekStartsOn: 1 });
  return format(mon, 'yyyy-MM-dd');
}

export function subWeeksFromToday(n: number): string {
  return format(subWeeks(new Date(), n), 'yyyy-MM-dd');
}
