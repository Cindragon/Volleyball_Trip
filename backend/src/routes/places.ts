import { Request, Response } from 'express';
import axios from 'axios';
import { getCuratedNearby, filterByType, CuratedPlace } from '../db/curatedPlaces';
import sql from '../db/database';
import { asyncRouter } from '../middleware/asyncRouter';
import { photoLimiter, placesLimiter } from '../middleware/rateLimit';
import { MAX_LENGTH } from '../utils/limits';

const router = asyncRouter();

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

async function getAdminPlacesForCity(
  city: string | undefined,
  type?: string
): Promise<CuratedPlace[]> {
  if (!city) return [];

  const rows = (
    type
      ? await sql`SELECT * FROM admin_places WHERE lower(city) = lower(${city}) AND category = ${type}`
      : await sql`SELECT * FROM admin_places WHERE lower(city) = lower(${city})`
  ) as unknown as AdminPlaceRow[];

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
 * Upper bound for each Google call. Without it a slow Google response keeps the
 * serverless function alive until the platform kills it; with it we fall back
 * to the curated list instead.
 */
export const GOOGLE_TIMEOUT_MS = 5000;

const MAX_RADIUS_M = 50000; // Google Places Nearby Search maximum
// Google place types are lower_snake_case words, e.g. tourist_attraction.
const PLACE_TYPE_REGEX = /^[a-z_]{1,50}$/;

/** Optional single-valued query string (rejects repeated params like ?city=a&city=b). */
function optionalQueryString(v: unknown): string | undefined | null {
  if (v === undefined || v === '') return undefined;
  return typeof v === 'string' ? v : null;
}

router.get('/nearby', placesLimiter, async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radius = '2000' } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || Math.abs(latNum) > 90 || !Number.isFinite(lngNum) || Math.abs(lngNum) > 180) {
    res.status(400).json({ error: 'lat must be between -90 and 90 and lng between -180 and 180' });
    return;
  }
  const radiusNum = Number(radius);
  if (!Number.isInteger(radiusNum) || radiusNum < 1 || radiusNum > MAX_RADIUS_M) {
    res.status(400).json({ error: `radius must be an integer between 1 and ${MAX_RADIUS_M}` });
    return;
  }

  const typeStr = optionalQueryString(req.query.type);
  const cityStr = optionalQueryString(req.query.city);
  const keyword = optionalQueryString(req.query.keyword);
  if (typeStr === null || (typeStr !== undefined && !PLACE_TYPE_REGEX.test(typeStr))) {
    res.status(400).json({ error: 'type must be a Google place type such as tourist_attraction' });
    return;
  }
  if (cityStr === null || (cityStr !== undefined && cityStr.length > MAX_LENGTH.city)) {
    res.status(400).json({ error: `city must be at most ${MAX_LENGTH.city} characters` });
    return;
  }
  if (keyword === null || (keyword !== undefined && keyword.length > MAX_LENGTH.keyword)) {
    res.status(400).json({ error: `keyword must be at most ${MAX_LENGTH.keyword} characters` });
    return;
  }

  const buildFallback = async (): Promise<CuratedPlace[]> => {
    const admin = await getAdminPlacesForCity(cityStr, typeStr);
    const curated = filterByType(getCuratedNearby(cityStr, latNum, lngNum), typeStr);
    return [...admin, ...curated];
  };

  const key = MAPS_KEY();
  if (!key) {
    res.json({ results: await buildFallback(), status: 'OK', source: 'curated' });
    return;
  }

  try {
    const params: Record<string, string> = {
      location: `${latNum},${lngNum}`,
      radius: String(radiusNum),
      key,
    };
    if (typeStr) params.type = typeStr;
    if (keyword) params.keyword = keyword;

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      { params, timeout: GOOGLE_TIMEOUT_MS }
    );

    const results = (response.data.results as any[]).map(place => ({
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
        results: await buildFallback(),
        status: response.data.status ?? 'ZERO_RESULTS',
        source: 'curated',
      });
      return;
    }

    const adminExtras = await getAdminPlacesForCity(cityStr, typeStr);
    res.json({
      results: [...adminExtras, ...results],
      status: response.data.status,
      next_page_token: response.data.next_page_token ?? null,
      source: adminExtras.length ? 'google+admin' : 'google',
    });
  } catch (err: any) {
    console.error('Places API error:', err.message);
    res.json({ results: await buildFallback(), status: 'OK', source: 'curated' });
  }
});

// Google photo references are long base64url-style tokens.
const PHOTO_REF_REGEX = /^[A-Za-z0-9_-]{10,2048}$/;

router.get('/photo', photoLimiter, async (req: Request, res: Response): Promise<void> => {
  const { ref, maxwidth = '400' } = req.query;

  if (typeof ref !== 'string' || !PHOTO_REF_REGEX.test(ref)) {
    res.status(400).json({ error: 'A valid ref is required' });
    return;
  }
  const width = Number(maxwidth);
  if (!Number.isInteger(width) || width < 1 || width > 1600) {
    res.status(400).json({ error: 'maxwidth must be an integer between 1 and 1600' });
    return;
  }

  const key = MAPS_KEY();
  if (!key) {
    res.status(503).json({ error: 'Photo service not configured' });
    return;
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/photo',
      {
        params: { photoreference: ref, maxwidth: width, key },
        responseType: 'stream',
        timeout: GOOGLE_TIMEOUT_MS,
      }
    );
    const contentType = response.headers['content-type'] as string | undefined;
    if (contentType) res.set('Content-Type', contentType);
    // Let browsers/CDNs cache photos so repeat views don't spend API quota.
    res.set('Cache-Control', 'public, max-age=86400');
    (response.data as NodeJS.ReadableStream).pipe(res);
  } catch (err: any) {
    console.error('Photo API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch photo' });
  }
});

export default router;
