/** Dates are the user's local calendar date (not UTC), formatted YYYY-MM-DD. */
export function toLocalISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toLocalISODate(new Date(y, m - 1, d + days));
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** The seven dates (Sunday to Saturday) of the week containing `iso`. */
export function weekOf(iso: string): string[] {
  const [y, m, d] = iso.split('-').map(Number);
  const start = addDays(iso, -new Date(y, m - 1, d).getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Short weekday name in the user's locale, e.g. "Sat". */
export function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
}
