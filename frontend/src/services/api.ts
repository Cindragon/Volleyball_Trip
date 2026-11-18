import axios from 'axios';
import type { Team, Itinerary, ItineraryStop, NearbyPlace, User, AdminPlace } from '../types';

/**
 * API calls always go to this site's own /api path:
 *   - local dev: Vite proxies /api to the backend (vite.config.ts)
 *   - Vercel:    frontend/vercel.json rewrites /api to the backend project
 * Same origin keeps the httpOnly session cookie first-party, so browsers that
 * block third-party cookies still send it, and no CORS is involved.
 */
const api = axios.create({
  baseURL: '/api',
  // Required by the backend for cookie-authenticated writes (CSRF guard).
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

/**
 * Public, cookie-less resources (place photos) are loaded straight from the
 * backend when VITE_API_BASE_URL is set, so they skip the extra proxy hop and
 * the backend rate-limits them by the visitor's real IP. Falls back to the
 * same-origin proxy.
 */
const PUBLIC_ASSET_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

// When a request comes back 401 (session expired/invalid) or 403 for a
// deactivated account, notify the AuthProvider so it can clear the session.
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

/** Failed credentials are a form error, not an expired session. */
const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/register'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.error;
    const url: string = error?.config?.url ?? '';
    const isDeactivated = status === 403 && message === 'Account has been deactivated';
    if ((status === 401 || isDeactivated) && !CREDENTIAL_ENDPOINTS.includes(url)) {
      onSessionExpired?.();
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post<{ user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: User }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  /** `user` is null when there is no session. */
  me: () => api.get<{ user: User | null }>('/auth/me'),
};

// ── Teams ─────────────────────────────────────────────────────────────────────
export const teamsApi = {
  list: (params?: { league?: string; country?: string }) =>
    api.get<{ teams: Team[] }>('/teams', { params }),

  leagues: () =>
    api.get<{ leagues: Record<string, string[]> }>('/teams/leagues'),

  get: (id: number) =>
    api.get<{ team: Team }>(`/teams/${id}`),
};

// ── Itineraries ───────────────────────────────────────────────────────────────
export const itinerariesApi = {
  list: () =>
    api.get<{ itineraries: Itinerary[] }>('/itineraries'),

  create: (data: { team_id: number; title: string; visit_date: string; notes?: string }) =>
    api.post<{ itinerary: Itinerary }>('/itineraries', data),

  get: (id: number) =>
    api.get<{ itinerary: Itinerary }>(`/itineraries/${id}`),

  update: (id: number, data: Partial<{ title: string; visit_date: string; notes: string }>) =>
    api.put<{ itinerary: Itinerary }>(`/itineraries/${id}`, data),

  delete: (id: number) =>
    api.delete(`/itineraries/${id}`),

  addStop: (
    itineraryId: number,
    data: Omit<ItineraryStop, 'id' | 'itinerary_id'>
  ) =>
    api.post<{ stop: ItineraryStop }>(`/itineraries/${itineraryId}/stops`, data),

  updateStop: (
    itineraryId: number,
    stopId: number,
    data: Partial<ItineraryStop>
  ) =>
    api.put<{ stop: ItineraryStop }>(`/itineraries/${itineraryId}/stops/${stopId}`, data),

  deleteStop: (itineraryId: number, stopId: number) =>
    api.delete(`/itineraries/${itineraryId}/stops/${stopId}`),
};

// ── Places ────────────────────────────────────────────────────────────────────
export const placesApi = {
  nearby: (params: { lat: number; lng: number; type?: string; radius?: number; keyword?: string; city?: string }) =>
    api.get<{ results: NearbyPlace[]; status: string; source?: 'google' | 'curated' }>('/places/nearby', { params }),

  photoUrl: (ref: string, maxwidth = 400) =>
    `${PUBLIC_ASSET_ORIGIN}/api/places/photo?ref=${encodeURIComponent(ref)}&maxwidth=${maxwidth}`,
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  // Teams
  createTeam: (data: Omit<Team, 'id'>) =>
    api.post<{ team: Team }>('/admin/teams', data),

  deleteTeam: (id: number) =>
    api.delete<{ deleted: number }>(`/admin/teams/${id}`),

  // Curated places (admin-managed)
  listPlaces: () =>
    api.get<{ places: AdminPlace[] }>('/admin/places'),

  createPlace: (data: Omit<AdminPlace, 'id' | 'created_by' | 'created_at'>) =>
    api.post<{ place: AdminPlace }>('/admin/places', data),

  deletePlace: (id: number) =>
    api.delete<{ deleted: number }>(`/admin/places/${id}`),

  // Users
  listUsers: () =>
    api.get<{ users: User[] }>('/admin/users'),

  setUserActive: (id: number, is_active: boolean) =>
    api.patch<{ id: number; is_active: boolean }>(`/admin/users/${id}/status`, { is_active }),

  setUserAdmin: (id: number, is_admin: boolean) =>
    api.patch<{ id: number; is_admin: boolean }>(`/admin/users/${id}/admin`, { is_admin }),
};

export default api;
