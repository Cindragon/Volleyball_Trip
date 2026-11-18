import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { getErrorMessage } from './errors';

const axiosErrorWith = (data: unknown) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    data, status: 400, statusText: 'Bad Request', headers: {}, config: { headers: new AxiosHeaders() },
  });

describe('getErrorMessage', () => {
  it('returns the API { error } message', () => {
    expect(getErrorMessage(axiosErrorWith({ error: 'title is required' }), 'fallback')).toBe('title is required');
  });

  it('falls back when the response has no usable message', () => {
    expect(getErrorMessage(axiosErrorWith({}), 'fallback')).toBe('fallback');
    expect(getErrorMessage(axiosErrorWith({ error: '' }), 'fallback')).toBe('fallback');
    expect(getErrorMessage(new AxiosError('Network Error'), 'fallback')).toBe('fallback');
  });

  it('falls back for non-axios errors', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
    expect(getErrorMessage('oops', 'fallback')).toBe('fallback');
  });
});
