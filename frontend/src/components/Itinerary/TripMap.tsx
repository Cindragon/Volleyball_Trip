import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MAPS_KEY, MAP_ID } from '../../config/maps';
import type { Itinerary, ItineraryStop } from '../../types';
import { tripMapCenter } from '../../utils/tripMap';

/** Map of the arena plus every stop (day 1 dark, day 2 light), with a legend. */
export default function TripMap({ itinerary, stops }: { itinerary: Itinerary; stops: ItineraryStop[] }) {
  const [selectedMarker, setSelectedMarker] = useState<ItineraryStop | null>(null);
  const arenaPos = { lat: itinerary.team_lat, lng: itinerary.team_lng };
  const mapCenter = tripMapCenter(arenaPos, stops);

  return (
    <>
      <Box className="map-container" sx={{ height: { xs: 340, md: 500 } }}>
        <APIProvider apiKey={MAPS_KEY}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={14}
            mapId={MAP_ID}
            style={{ width: '100%', height: '100%' }}
            colorScheme="DARK"
          >
            {/* Arena marker */}
            <AdvancedMarker position={arenaPos} title={itinerary.arena_name}>
              <Pin background={itinerary.primary_color} borderColor="#0a090c" glyphColor="#fff" scale={1.3} />
            </AdvancedMarker>

            {/* Stop markers */}
            {stops.map(stop => (
              <AdvancedMarker
                key={stop.id}
                position={{ lat: stop.lat, lng: stop.lng }}
                title={stop.name}
                onClick={() => setSelectedMarker(stop)}
              >
                <Pin
                  background={stop.day === 1 ? '#2c666e' : '#eef7f7'}
                  borderColor="#0a090c"
                  glyphColor="#fff"
                  scale={0.9}
                />
              </AdvancedMarker>
            ))}

            {/* Info window for selected marker */}
            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0a090c', fontSize: '0.85rem' }}>
                    {selectedMarker.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#555' }}>
                    Day {selectedMarker.day} · {selectedMarker.category}
                  </Typography>
                </Box>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2.5, mt: 1.5, px: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: itinerary.primary_color }} />
          <Typography variant="caption" color="text.secondary">Arena</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#2c666e' }} />
          <Typography variant="caption" color="text.secondary">Day 1 stops</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#eef7f7', border: '1px solid #0a090c' }} />
          <Typography variant="caption" color="text.secondary">Day 2 stops</Typography>
        </Box>
      </Box>
    </>
  );
}
