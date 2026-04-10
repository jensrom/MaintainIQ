/**
 * Danske helligdage beregnet dynamisk via Påske-algoritmen (Gauss/Anonymous).
 * Returnerer alle helligdage for et givet år som ISO-datostrenge.
 */

function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DanishHoliday {
  date: string;
  name: string;
}

export function getDanishHolidays(year: number): DanishHoliday[] {
  const easter = easterDate(year);
  const holidays: DanishHoliday[] = [
    { date: `${year}-01-01`, name: 'Nytårsdag' },
    { date: toISO(addDays(easter, -3)), name: 'Skærtorsdag' },
    { date: toISO(addDays(easter, -2)), name: 'Langfredag' },
    { date: toISO(easter), name: 'Påskedag' },
    { date: toISO(addDays(easter, 1)), name: '2. Påskedag' },
    { date: toISO(addDays(easter, 39)), name: 'Kristi Himmelfartsdag' },
    { date: toISO(addDays(easter, 49)), name: 'Pinsedag' },
    { date: toISO(addDays(easter, 50)), name: '2. Pinsedag' },
    { date: `${year}-06-05`, name: 'Grundlovsdag' },
    { date: `${year}-12-24`, name: 'Juleaftensdag' },
    { date: `${year}-12-25`, name: '1. Juledag' },
    { date: `${year}-12-26`, name: '2. Juledag' },
    { date: `${year}-12-31`, name: 'Nytårsaftensdag' },
  ];
  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

// Cache holidays per year for performance
const holidayCache = new Map<number, Map<string, string>>();

export function getHolidayMap(year: number): Map<string, string> {
  if (!holidayCache.has(year)) {
    const map = new Map<string, string>();
    getDanishHolidays(year).forEach((h) => map.set(h.date, h.name));
    holidayCache.set(year, map);
  }
  return holidayCache.get(year)!;
}

export function getHolidayName(isoDate: string): string | null {
  const year = parseInt(isoDate.slice(0, 4), 10);
  const map = getHolidayMap(year);
  return map.get(isoDate) ?? null;
}

export function isHoliday(isoDate: string): boolean {
  return getHolidayName(isoDate) !== null;
}

export function isWeekend(isoDate: string): boolean {
  const date = new Date(isoDate + 'T12:00:00');
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

export function isWorkday(isoDate: string): boolean {
  return !isWeekend(isoDate) && !isHoliday(isoDate);
}

/** Count workdays in a date range (inclusive) */
export function countWorkdays(from: string, to: string): number {
  let count = 0;
  const current = new Date(from + 'T12:00:00');
  const end = new Date(to + 'T12:00:00');
  while (current <= end) {
    const iso = toISO(current);
    if (isWorkday(iso)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/** Returns ISO dates of holidays within a range */
export function getHolidaysInRange(from: string, to: string): DanishHoliday[] {
  const years = new Set<number>();
  const y1 = parseInt(from.slice(0, 4), 10);
  const y2 = parseInt(to.slice(0, 4), 10);
  for (let y = y1; y <= y2; y++) years.add(y);

  const result: DanishHoliday[] = [];
  years.forEach((year) => {
    getDanishHolidays(year).forEach((h) => {
      if (h.date >= from && h.date <= to) result.push(h);
    });
  });
  return result.sort((a, b) => a.date.localeCompare(b.date));
}
