/** Google Maps browser key (restrict it to your site's HTTP referrers). */
export const MAPS_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '';

/**
 * Map ID created in Google Cloud Console → Map Management (JavaScript, Vector).
 * Required by AdvancedMarker. Falls back to Google's DEMO_MAP_ID, which is
 * fine for local development but should be replaced in production.
 */
export const MAP_ID: string = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

if (import.meta.env.DEV && !MAPS_KEY) {
  console.warn(
    '[VolleyTrip] VITE_GOOGLE_MAPS_KEY is not set — maps will fail to load. ' +
    'Copy frontend/.env.example to frontend/.env, fill in the key, and restart `npm run dev`.'
  );
}
