import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, setSessionExpiredHandler } from '../services/api';
import type { User } from '../types';
import { AuthContext } from './useAuth';

/**
 * The session lives in an httpOnly cookie that scripts cannot read, so the
 * app learns whether it is logged in by asking the API (/auth/me).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount.
  useEffect(() => {
    // Tokens used to be stored here; remove any left over from older versions.
    try { localStorage.removeItem('token'); } catch { /* storage unavailable */ }

    let cancelled = false;
    authApi.me()
      .then(({ data }) => { if (!cancelled) setUser(data.user); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setUser(data.user);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const { data } = await authApi.register({ username, email, password });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    // Clearing the cookie is best-effort: the user is logged out locally either way.
    await authApi.logout().catch(() => {});
  }, []);

  // The API reported the session is no longer valid: forget the user locally
  // (the server already rejected the cookie). RequireAuth then redirects.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
