export interface DailyCount {
  date: string;
  count: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

// Serie continua de los últimos `days` días (UTC), con 0 en los días sin envíos
export function buildDailySeries(
  rows: { day: string; count: number }[],
  days: number,
  now: Date = new Date(),
): DailyCount[] {
  const counts = new Map(rows.map((row) => [row.day, Number(row.count)]));
  const today = startOfUtcDay(now).getTime();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today - (days - 1 - index) * DAY_MS).toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });
}
