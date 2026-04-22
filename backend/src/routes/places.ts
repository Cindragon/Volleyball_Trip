import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const MAPS_KEY = () => process.env.GOOGLE_MAPS_API_KEY as string;

/**
 * GET /api/places/nearby
 * Query params: lat, lng, type (tourist_attraction|restaurant|lodging|museum|...), radius (default 2000m)
 *
 * Proxies Google Places Nearby Search so the API key stays server-side.
 */
router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, type, radius = '2000', keyword } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  try {
    const params: Record<string, string> = {
      location: `${lat},${lng}`,
      radius: radius as string,
      key: MAPS_KEY(),
    };
    if (type) params.type = type as string;
    if (keyword) params.keyword = keyword as string;

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      { params }
    );

    // Forward only what the frontend needs (avoid leaking raw API response)
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

    res.json({
      results,
      status: response.data.status,
      next_page_token: response.data.next_page_token ?? null,
    });
  } catch (err: any) {
    console.error('Places API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch places from Google API' });
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
