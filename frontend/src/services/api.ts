import axios from 'axios';
import type { Team, Itinerary, ItineraryStop, NearbyPlace, User } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),

  me: () => api.get<{ user: User }>('/auth/me'),
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
    `http://localhost:3001/api/places/photo?ref=${ref}&maxwidth=${maxwidth}`,
};

export default api;
