import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { authRateLimitKey } from '../src/middleware/rateLimit';

const req = (ip: string, body: Record<string, unknown> = {}, userId?: number) =>
  ({ ip, body, userId }) as unknown as Request;

describe('authRateLimitKey', () => {
  it('keeps IPv4 addresses and adds the normalized email', () => {
    expect(authRateLimitKey(req('203.0.113.7', { email: '  Alice@Example.COM ' }))).toBe('203.0.113.7|alice@example.com');
  });

  it('groups IPv6 addresses from the same /56 so rotating addresses does not reset the limit', () => {
    const a = authRateLimitKey(req('2001:db8:abcd:1200::1', { email: 'a@b.co' }));
    const b = authRateLimitKey(req('2001:db8:abcd:12ff:ffff:ffff:ffff:ffff', { email: 'a@b.co' }));
    const otherBlock = authRateLimitKey(req('2001:db8:abcd:1300::1', { email: 'a@b.co' }));
    expect(a).toBe(b);
    expect(a).not.toBe(otherBlock);
  });

  it('keys password changes on the signed-in account', () => {
    expect(authRateLimitKey(req('203.0.113.7', {}, 42))).toBe('203.0.113.7|user:42');
  });
});
