import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Options } from 'express-rate-limit';

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }));
vi.mock('../src/db/database', () => ({ default: sqlMock }));

import { PostgresStore } from '../src/middleware/postgresRateLimitStore';

const sqlText = (n: number) => (sqlMock.mock.calls[n][0] as TemplateStringsArray).join('?');
const sqlValues = (n: number) => sqlMock.mock.calls[n].slice(1);

beforeEach(() => {
  sqlMock.mockReset();
  sqlMock.mockResolvedValue([]);
  // Keep the ~1% opportunistic cleanup query out of these tests.
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

describe('PostgresStore', () => {
  const makeStore = () => {
    const store = new PostgresStore('auth');
    store.init({ windowMs: 900_000 } as Options);
    return store;
  };

  it('creates the table once, then upserts the prefixed key with the window', async () => {
    const reset = new Date(Date.now() + 900_000).toISOString();
    sqlMock
      .mockResolvedValueOnce([])                               // CREATE TABLE
      .mockResolvedValueOnce([{ hits: 1, reset_at: reset }])   // first increment
      .mockResolvedValueOnce([{ hits: 2, reset_at: reset }]);  // second increment

    const store = makeStore();
    const first = await store.increment('1.2.3.4');
    const second = await store.increment('1.2.3.4');

    expect(sqlText(0)).toContain('CREATE TABLE IF NOT EXISTS rate_limits');
    expect(sqlText(1)).toContain('ON CONFLICT (key) DO UPDATE');
    expect(sqlValues(1)).toEqual(['auth:1.2.3.4', 900_000]);
    // Table creation is not repeated for later calls.
    expect(sqlMock.mock.calls.filter(c => (c[0] as string[]).join('').includes('CREATE TABLE'))).toHaveLength(1);
    expect(first).toEqual({ totalHits: 1, resetTime: new Date(reset) });
    expect(second.totalHits).toBe(2);
  });

  it('decrements without going below zero and resets by deleting the row', async () => {
    const store = makeStore();
    await store.decrement('k');
    await store.resetKey('k');
    expect(sqlText(1)).toContain('GREATEST(hits - 1, 0)');
    expect(sqlValues(1)).toEqual(['auth:k']);
    expect(sqlText(2)).toContain('DELETE FROM rate_limits WHERE key =');
    expect(sqlValues(2)).toEqual(['auth:k']);
  });

  it('occasionally deletes expired windows', async () => {
    vi.mocked(Math.random).mockReturnValue(0);
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ hits: 1, reset_at: new Date().toISOString() }]);
    await makeStore().increment('k');
    expect(sqlText(2)).toContain('DELETE FROM rate_limits WHERE reset_at < now()');
  });

  it('retries table creation after a failure', async () => {
    sqlMock.mockRejectedValueOnce(new Error('db down'));
    const store = makeStore();
    await expect(store.increment('k')).rejects.toThrow('db down');

    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ hits: 1, reset_at: new Date().toISOString() }]);
    await expect(store.increment('k')).resolves.toMatchObject({ totalHits: 1 });
  });
});
