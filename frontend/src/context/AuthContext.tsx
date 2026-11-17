import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, setSessionExpiredHandler } from '../services/api';
import type { User } from '../types';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  // Only wait for /auth/me when there is a stored token to verify.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  // Restore session on mount
  useEffect(() => {
    if (!token) return;
    authApi.me()
      .then(({ data }) => setUser(data.user))
      .catch(() => { localStorage.removeItem('token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const { data } = await authApi.register({ username, email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Clear the session when the API reports the token is no longer valid;
  // RequireAuth then redirects to the login page.
  useEffect(() => {
    setSessionExpiredHandler(logout);
    return () => setSessionExpiredHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
