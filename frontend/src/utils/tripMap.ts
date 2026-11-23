import type { ItineraryStop } from '../types';

type LatLng = { lat: number; lng: number };

/** Centroid of the stops, or the arena when there are none. */
export function tripMapCenter(arenaPos: LatLng, stops: Pick<ItineraryStop, 'lat' | 'lng'>[]): LatLng {
  if (stops.length === 0) return arenaPos;
  return {
    lat: stops.reduce((sum, p) => sum + p.lat, 0) / stops.length,
    lng: stops.reduce((sum, p) => sum + p.lng, 0) / stops.length,
  };
}
