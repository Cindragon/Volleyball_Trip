import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getCuratedNearby, filterByType, CuratedPlace } from '../db/curatedPlaces';
import db from '../db/database';

const router = Router();

interface AdminPlaceRow {
  id: number;
  city: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  category: string;
  rating: number;
}

/** Admin-added places for a city, in the same shape as CuratedPlace. */
function getAdminPlacesForCity(city: string | undefined, type?: string): CuratedPlace[] {
  if (!city) return [];
  let sql = 'SELECT * FROM admin_places WHERE lower(city) = lower(?)';
  const params: any[] = [city];
  if (type) {
    sql += ' AND category = ?';
    params.push(type);
  }
  const rows = db.prepare(sql).all(...params) as AdminPlaceRow[];
  return rows.map(r => ({
    place_id: `admin-${r.id}`,
    name: r.name,
    address: r.address ?? '',
    lat: r.lat,
    lng: r.lng,
    rating: r.rating,
    user_ratings_total: 0,
    types: [r.category, 'point_of_interest'],
    photo_reference: null,
    opening_hours: null,
  }));
}

const MAPS_KEY = () => process.env.GOOGLE_MAPS_API_KEY as string;

/**
 * GET /api/places/nearby
 * Query params: lat, lng, type, radius (default 2000m), keyword, city
 *
 * Primary source: Google Places Nearby Search (proxied so the API key stays
 * server-side). When Google isn't configured, errors, or returns zero results
 * for the selected type, falls back to a curated dataset keyed by `city` so
 * the arena always surfaces recommended spots to the user.
 */
router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, type, radius = '2000', keyword, city } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const typeStr = type ? String(type) : undefined;
  const cityStr = city ? String(city) : undefined;

  /**
   * Fallback = admin-added (DB) + curated (hand-written) for this city, both
   * filtered by the requested type. Admin entries come first so they show on
   * top of any duplicates.
   */
  const buildFallback = (): CuratedPlace[] => {
    const admin = getAdminPlacesForCity(cityStr, typeStr);
    const curated = filterByType(getCuratedNearby(cityStr, latNum, lngNum), typeStr);
    return [...admin, ...curated];
  };

  const key = MAPS_KEY();
  if (!key) {
    res.json({ results: buildFallback(), status: 'OK', source: 'curated' });
    return;
  }

  try {
    const params: Record<string, string> = {
      location: `${lat},${lng}`,
      radius: radius as string,
      key,
    };
    if (typeStr)  params.type    = typeStr;
    if (keyword)  params.keyword = keyword as string;

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      { params }
    );

    const results = (response.data.results as any[]).map((place) => ({
      place_id: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      photo_reference: place.photos?.[0]?.photo_reference ?? null,
      opening_hours: place.opening_hours ?? null,
    }));

    if (results.length === 0) {
      res.json({
        results: buildFallback(),
        status: response.data.status ?? 'ZERO_RESULTS',
        source: 'curated',
      });
      return;
    }

    // Always prepend admin-added places for this city so staff picks surface
    // on top of Google results as well.
    const adminExtras = getAdminPlacesForCity(cityStr, typeStr);

    res.json({
      results: [...adminExtras, ...results],
      status: response.data.status,
      next_page_token: response.data.next_page_token ?? null,
      source: adminExtras.length ? 'google+admin' : 'google',
    });
  } catch (err: any) {
    console.error('Places API error:', err.message);
    res.json({ results: buildFallback(), status: 'OK', source: 'curated' });
  }
});

/**
 * GET /api/places/photo?ref=PHOTO_REFERENCE&maxwidth=400
 * Proxies Google Place Photo to avoid exposing API key on the client.
 */
router.get('/photo', async (req: Request, res: Response): Promise<void> => {
  const { ref, maxwidth = '400' } = req.query;

  if (!ref) {
    res.status(400).json({ error: 'ref is required' });
    return;
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/photo',
      {
        params: { photoreference: ref, maxwidth, key: MAPS_KEY() },
        responseType: 'stream',
      }
    );
    res.set('Content-Type', response.headers['content-type']);
    (response.data as NodeJS.ReadableStream).pipe(res);
  } catch (err: any) {
    console.error('Photo API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch photo' });
  }
});

export default router;
