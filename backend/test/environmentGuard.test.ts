import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }));
vi.mock('../src/db/database', () => ({ default: sqlMock }));

import {
  databaseEndpoint,
  assertNotProductionDatabase,
  recordProductionDatabase,
  ProductionDatabaseError,
} from '../src/db/environmentGuard';

const PROD_URL = 'postgresql://u:p@ep-calm-sun-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';
const PROD_ENDPOINT = 'ep-calm-sun-123456.us-east-2.aws.neon.tech';
const DEV_URL = 'postgresql://u:p@ep-quiet-moon-654321.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sqlText = (n: number) => (sqlMock.mock.calls[n][0] as TemplateStringsArray).join('?');

const saved = { ...process.env };
beforeEach(() => {
  sqlMock.mockReset();
  sqlMock.mockResolvedValue([]);
  for (const k of ['VERCEL', 'VERCEL_ENV', 'ALLOW_PRODUCTION_DB']) delete process.env[k];
});
afterEach(() => { process.env = { ...saved }; });

/** The local check reads: does app_meta exist, then the recorded endpoint. */
function productionRecordedAs(endpoint: string | null) {
  sqlMock
    .mockResolvedValueOnce([{ exists: endpoint !== null }])
    .mockResolvedValueOnce(endpoint ? [{ value: endpoint }] : []);
}

describe('databaseEndpoint', () => {
  it('treats the pooled and direct hosts as the same endpoint', () => {
    expect(databaseEndpoint(PROD_URL)).toBe(PROD_ENDPOINT);
    expect(databaseEndpoint(PROD_URL.replace('-pooler', ''))).toBe(PROD_ENDPOINT);
  });

  it('returns null for a missing or malformed URL', () => {
    expect(databaseEndpoint(undefined)).toBeNull();
    expect(databaseEndpoint('not a url')).toBeNull();
  });
});

describe('assertNotProductionDatabase', () => {
  it('refuses to run locally against the production endpoint', async () => {
    process.env.DATABASE_URL = PROD_URL.replace('-pooler', ''); // direct host, same endpoint
    productionRecordedAs(PROD_ENDPOINT);
    await expect(assertNotProductionDatabase('npm run seed')).rejects.toBeInstanceOf(ProductionDatabaseError);
  });

  it('allows a Neon branch even though it copied the production marker', async () => {
    process.env.DATABASE_URL = DEV_URL;
    productionRecordedAs(PROD_ENDPOINT);
    await expect(assertNotProductionDatabase('npm run seed')).resolves.toBeUndefined();
  });

  it('allows a fresh database with no marker', async () => {
    process.env.DATABASE_URL = DEV_URL;
    productionRecordedAs(null);
    await expect(assertNotProductionDatabase('npm run migrate')).resolves.toBeUndefined();
    expect(sqlMock).toHaveBeenCalledTimes(1); // stops after the table check
  });

  it('lets an explicit override through with a warning', async () => {
    process.env.DATABASE_URL = PROD_URL;
    process.env.ALLOW_PRODUCTION_DB = 'true';
    productionRecordedAs(PROD_ENDPOINT);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(assertNotProductionDatabase('npm run seed')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('PRODUCTION'));
    warn.mockRestore();
  });

  it('never blocks the deployed app', async () => {
    process.env.VERCEL = '1';
    process.env.DATABASE_URL = PROD_URL;
    await assertNotProductionDatabase('the API');
    expect(sqlMock).not.toHaveBeenCalled();
  });
});

describe('recordProductionDatabase', () => {
  it('records the endpoint on the production deployment', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.DATABASE_URL = PROD_URL;
    await recordProductionDatabase();
    expect(sqlText(0)).toContain('CREATE TABLE IF NOT EXISTS app_meta');
    expect(sqlMock.mock.calls[1].slice(1)).toEqual(['production_db_endpoint', PROD_ENDPOINT]);
  });

  it.each([['preview'], ['development'], [undefined]])('does nothing when VERCEL_ENV is %s', async (env) => {
    if (env) process.env.VERCEL_ENV = env;
    process.env.DATABASE_URL = DEV_URL;
    await recordProductionDatabase();
    expect(sqlMock).not.toHaveBeenCalled();
  });
});
