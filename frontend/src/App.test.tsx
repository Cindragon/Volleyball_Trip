import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { authApi } = vi.hoisted(() => ({
  authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));

vi.mock('./services/api', () => ({
  authApi,
  setSessionExpiredHandler: () => {},
  itinerariesApi: { list: vi.fn().mockResolvedValue({ data: { itineraries: [] } }) },
  teamsApi: {},
  placesApi: {},
  adminApi: {},
}));

import App from './App';

beforeEach(() => vi.clearAllMocks());

describe('protected routes', () => {
  it('sends anonymous visitors from My Trips to the login page', async () => {
    authApi.me.mockResolvedValue({ data: { user: null } });
    window.history.pushState({}, '', '/itineraries');
    render(<App />);

    expect(await screen.findByText(/Sign in to continue/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('lets a signed-in user open My Trips', async () => {
    authApi.me.mockResolvedValue({
      data: { user: { id: 1, username: 'alice', email: 'a@example.com', is_admin: false, is_active: true } },
    });
    window.history.pushState({}, '', '/itineraries');
    render(<App />);

    expect(await screen.findByText('My Trips')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/itineraries');
  });
});
