import type { ItineraryStop } from '../types';

/** Google place types offered when adding a stop, and the stop category each becomes. */
export const PLACE_TYPES = [
  { key: 'tourist_attraction', label: 'Attractions', icon: '🏛️', category: 'attraction' },
  { key: 'restaurant',         label: 'Restaurants', icon: '🍽️', category: 'restaurant' },
  { key: 'lodging',            label: 'Hotels',      icon: '🏨', category: 'lodging' },
  { key: 'museum',             label: 'Museums',     icon: '🖼️', category: 'museum' },
  { key: 'cafe',               label: 'Cafés',       icon: '☕', category: 'other' },
] as const satisfies readonly { key: string; label: string; icon: string; category: ItineraryStop['category'] }[];

export type AddStopPlaceType = (typeof PLACE_TYPES)[number]['key'];

/** Stop category for a place found under the given search type. */
export function categoryForPlaceType(placeType: string): ItineraryStop['category'] {
  return PLACE_TYPES.find(t => t.key === placeType)?.category ?? 'other';
}
