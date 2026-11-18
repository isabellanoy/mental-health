import { buildDailySeries } from './stats.js';

describe('buildDailySeries', () => {
  it('devuelve una serie continua con ceros en los días sin envíos', () => {
    const now = new Date('2026-11-16T10:00:00Z');
    const series = buildDailySeries([{ day: '2026-11-16', count: 3 }, { day: '2026-11-14', count: 1 }], 3, now);
    expect(series).toEqual([
      { date: '2026-11-14', count: 1 },
      { date: '2026-11-15', count: 0 },
      { date: '2026-11-16', count: 3 },
    ]);
  });

  it('genera 14 días por defecto en el orden más antiguo → más reciente', () => {
    const series = buildDailySeries([], 14, new Date('2026-11-16T00:00:00Z'));
    expect(series).toHaveLength(14);
    expect(series[0].date).toBe('2026-11-03');
    expect(series[13].date).toBe('2026-11-16');
  });
});
