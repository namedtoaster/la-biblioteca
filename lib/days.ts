// A "day" starts at 4am local time, so answering at 1am still counts as the day before.
export const ROLLOVER_HOUR = 4;

const DAY_MS = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local day key, YYYY-MM-DD, with the day starting at ROLLOVER_HOUR. */
export function dayKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - ROLLOVER_HOUR * 3_600_000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}

/** Whole days since 1970-01-01 for a day key. Independent of time zone. */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function shiftDay(key: string, days: number): string {
  const date = new Date((dayNumber(key) + days) * DAY_MS);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Weeks start on Monday. Day 0 (1970-01-01) was a Thursday, hence the +3. */
export function weekNumber(key: string): number {
  return Math.floor((dayNumber(key) + 3) / 7);
}

/** How many distinct weeks have at least one clip. Missed days never count against you. */
export function weeksShowedUp(keys: string[]): number {
  return new Set(keys.map(weekNumber)).size;
}

export function formatDay(key: string, locale = 'en-US'): string {
  const date = new Date(dayNumber(key) * DAY_MS);
  return date.toLocaleDateString(locale, { month: 'long', day: 'numeric', timeZone: 'UTC' });
}
