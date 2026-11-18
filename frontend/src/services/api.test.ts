import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import api, { authApi, placesApi, itinerariesApi, setSessionExpiredHandler } from './api';

/** Replaces the network layer: every request answers with the given status/body. */
function respondWith(status: number, data: unknown = {}) {
  const adapter: AxiosAdapter = (config: InternalAxiosRequestConfig) => {
    const response = { data, status, statusText: '', headers: {}, config };
    return status < 400
      ? Promise.resolve(response)
      : Promise.reject(new AxiosError('failed', 'ERR_BAD_RESPONSE', config, null, response));
  };
  api.defaults.adapter = adapter;
}

const originalAdapter = api.defaults.adapter;
const expired = vi.fn();

beforeEach(() => {
  expired.mockClear();
  setSessionExpiredHandler(expired);
});

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  setSessionExpiredHandler(null);
});

describe('api client', () => {
  it('calls the same-origin /api path and sends the CSRF header', async () => {
    let seen: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = (config) => {
      seen = config;
      return Promise.resolve({ data: { itineraries: [] }, status: 200, statusText: '', headers: {}, config });
    };
    await itinerariesApi.list();

    const headers = AxiosHeaders.from(seen?.headers);
    expect(seen?.baseURL).toBe('/api');
    expect(headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    // No token is ever attached by script: the session is an httpOnly cookie.
    expect(headers.has('Authorization')).toBe(false);
  });

  it('reports an expired session on 401', async () => {
    respondWith(401, { error: 'Invalid or expired token' });
    await expect(itinerariesApi.list()).rejects.toBeInstanceOf(AxiosError);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('reports a deactivated account (403) but not other 403s', async () => {
    respondWith(403, { error: 'Account has been deactivated' });
    await expect(itinerariesApi.list()).rejects.toThrow();
    expect(expired).toHaveBeenCalledTimes(1);

    respondWith(403, { error: 'Admin privileges required' });
    await expect(itinerariesApi.list()).rejects.toThrow();
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('treats a failed login as a form error, not an expired session', async () => {
    respondWith(401, { error: 'Invalid email or password' });
    await expect(authApi.login({ email: 'a@b.co', password: 'x' })).rejects.toThrow();
    expect(expired).not.toHaveBeenCalled();
  });
});

describe('placesApi.photoUrl', () => {
  it('loads photos straight from the backend origin and encodes the ref', () => {
    expect(placesApi.photoUrl('abc&key=evil', 200)).toBe(
      'https://api.example.test/api/places/photo?ref=abc%26key%3Devil&maxwidth=200'
    );
  });
});
