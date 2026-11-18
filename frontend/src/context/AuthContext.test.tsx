import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

const { authApi, handlerRef } = vi.hoisted(() => ({
  authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
  handlerRef: { current: null as null | (() => void) },
}));

vi.mock('../services/api', () => ({
  authApi,
  setSessionExpiredHandler: (h: (() => void) | null) => { handlerRef.current = h; },
}));

const ALICE = { id: 1, username: 'alice', email: 'alice@example.com', is_admin: false, is_active: true };

function Probe() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>{user ? `hello ${user.username}` : 'anonymous'}</p>
      <button onClick={() => login('alice@example.com', 'pw')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const renderProbe = () => render(<AuthProvider><Probe /></AuthProvider>);

beforeEach(() => {
  vi.clearAllMocks();
  authApi.logout.mockResolvedValue({});
});

describe('AuthProvider', () => {
  it('restores the session from /auth/me', async () => {
    authApi.me.mockResolvedValue({ data: { user: ALICE } });
    renderProbe();
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('hello alice')).toBeInTheDocument();
  });

  it('is anonymous when there is no session', async () => {
    authApi.me.mockResolvedValue({ data: { user: null } });
    renderProbe();
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('removes tokens left in localStorage by older versions', async () => {
    localStorage.setItem('token', 'legacy');
    authApi.me.mockResolvedValue({ data: { user: null } });
    renderProbe();
    await screen.findByText('anonymous');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logs in, then logs out through the API', async () => {
    authApi.me.mockResolvedValue({ data: { user: null } });
    authApi.login.mockResolvedValue({ data: { user: ALICE } });
    renderProbe();
    await screen.findByText('anonymous');

    act(() => screen.getByText('login').click());
    expect(await screen.findByText('hello alice')).toBeInTheDocument();

    act(() => screen.getByText('logout').click());
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
  });

  it('drops the user when the API reports the session expired', async () => {
    authApi.me.mockResolvedValue({ data: { user: ALICE } });
    renderProbe();
    await screen.findByText('hello alice');

    act(() => handlerRef.current?.());
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
  });
});
