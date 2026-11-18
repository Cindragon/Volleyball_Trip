import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { isChunkLoadError, reloadForNewBuild } from '../utils/chunkReload';

function Boom({ error }: { error: Error }): never {
  throw error;
}

const reload = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  reload.mockClear();
  sessionStorage.clear();
  Object.defineProperty(window, 'location', { configurable: true, value: { ...originalLocation, reload } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  vi.restoreAllMocks();
});

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/TeamsPage-abc.js',
    'error loading dynamically imported module',
    'Importing a module script failed.',
  ])('recognizes %s', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('ignores ordinary errors', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
  });
});

describe('reloadForNewBuild', () => {
  it('reloads once, then refuses within the guard window', () => {
    expect(reloadForNewBuild()).toBe(true);
    expect(reloadForNewBuild()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorBoundary', () => {
  it('shows a recovery screen instead of a blank page', () => {
    render(<ErrorBoundary><Boom error={new Error('kaboom')} /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads automatically when a lazy page chunk is missing after a deploy', () => {
    render(<ErrorBoundary><Boom error={new TypeError('Failed to fetch dynamically imported module: /assets/x.js')} /></ErrorBoundary>);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent('A new version is available');
  });
});
