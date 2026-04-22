export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  league: string;
  country: string;
  city: string;
  arena_name: string;
  lat: number;
  lng: number;
  logo_url?: string;
  primary_color: string;
  website_url?: string;
}

export interface ItineraryStop {
  id: number;
  itinerary_id: number;
  place_id?: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  category: 'attraction' | 'restaurant' | 'lodging' | 'museum' | 'shopping' | 'other';
  day: 1 | 2;
  order_index: number;
  notes?: string;
  photo_reference?: string;
}

export interface Itinerary {
  id: number;
  user_id: number;
  team_id: number;
  title: string;
  visit_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  team_name: string;
  team_short_name: string;
  team_city: string;
  team_country: string;
  team_league: string;
  arena_name: string;
  team_lat: number;
  team_lng: number;
  primary_color: string;
  stop_count?: number;
  stops?: ItineraryStop[];
}

export interface NearbyPlace {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  photo_reference?: string;
  opening_hours?: { open_now: boolean };
}

export type PlaceType =
  | 'tourist_attraction'
  | 'restaurant'
  | 'lodging'
  | 'museum'
  | 'shopping_mall'
  | 'park'
  | 'cafe';

export const COUNTRY_FLAGS: Record<string, string> = {
  Italy: '🇮🇹',
  Japan: '🇯🇵',
  Poland: '🇵🇱',
  Turkey: '🇹🇷',
};

export const LEAGUE_DISPLAY: Record<string, { label: string; country: string }> = {
  SuperLega:    { label: 'SuperLega',   country: 'Italy'  },
  'SV.League':  { label: 'SV.League',   country: 'Japan'  },
  PlusLiga:     { label: 'PlusLiga',    country: 'Poland' },
  'Efeler Ligi':{ label: 'Efeler Ligi', country: 'Turkey' },
};

export const CATEGORY_ICONS: Record<string, string> = {
  attraction: '🏛️',
  restaurant:  '🍽️',
  lodging:     '🏨',
  museum:      '🖼️',
  shopping:    '🛍️',
  other:       '📍',
};
