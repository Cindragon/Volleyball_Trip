import type { Itinerary, ItineraryStop } from '../types';

export function makeStop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return {
    id: 1,
    itinerary_id: 7,
    name: 'Mole Antonelliana',
    address: 'Via Montebello 20',
    lat: 45.069,
    lng: 7.693,
    category: 'attraction',
    day: 1,
    order_index: 0,
    ...overrides,
  };
}

export function makeItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  return {
    id: 7,
    user_id: 1,
    team_id: 3,
    title: 'Turin weekend',
    visit_date: '2026-12-05',
    notes: 'Bring the scarf',
    created_at: '2026-11-20T00:00:00Z',
    updated_at: '2026-11-20T00:00:00Z',
    team_name: 'Cuneo Volley',
    team_short_name: 'Cuneo',
    team_city: 'Torino',
    team_country: 'Italy',
    team_league: 'SuperLega',
    arena_name: 'Pala Gianni Asti',
    team_lat: 45.04,
    team_lng: 7.65,
    primary_color: '#1976d2',
    stops: [],
    ...overrides,
  };
}

/** Shaped like an axios error, which is what getErrorMessage looks for. */
export const apiError = (status: number, error: string) =>
  ({ isAxiosError: true, response: { status, data: { error } } });
