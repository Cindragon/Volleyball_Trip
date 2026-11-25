/**
 * Input limits shared by the API routes. The frontend mirrors the text limits
 * (frontend/src/utils/limits.ts) as `maxLength` on its form fields.
 */
export const MAX_LENGTH = {
  username: 40,
  email: 254,
  itineraryTitle: 120,
  notes: 2000,
  stopName: 200,
  address: 300,
  city: 100,
  placeId: 300,
  photoReference: 2048,
  keyword: 100,
  teamName: 120,
  shortName: 40,
  league: 60,
  country: 60,
  arenaName: 200,
  url: 2048,
} as const;

/** A trip has two days; this keeps the map and list usable. */
export const MAX_STOPS_PER_ITINERARY = 50;

/** Categories the frontend knows how to draw (see CATEGORY_ICONS). */
export const STOP_CATEGORIES = ['attraction', 'restaurant', 'lodging', 'museum', 'shopping', 'other'] as const;

/**
 * Returns an error message when a present string field is longer than allowed.
 * Non-string values are left to the caller's own type checks.
 */
export function lengthError(fields: Record<string, [unknown, number]>): string | null {
  for (const [name, [value, max]] of Object.entries(fields)) {
    if (typeof value === 'string' && value.length > max) {
      return `${name} must be at most ${max} characters`;
    }
  }
  return null;
}
