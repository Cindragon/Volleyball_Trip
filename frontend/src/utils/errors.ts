import { isAxiosError } from 'axios';

/** Extracts the API's `{ error }` message from a failed request, or returns the fallback. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<{ error?: string }>(err)) {
    const message = err.response?.data?.error;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
