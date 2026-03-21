import { getPublicCorsHeaders } from './_cors.js';
import { jsonResponse } from './_json-response.js';

export const config = { runtime: 'edge' };

const NRCAN_API_URL = 'https://www.earthquakescanada.nrcan.gc.ca/api/v2/locations/30d.json';
const CACHE_TTL = 1800; // 30 minutes

// GTA bounding box
const GTA_BOUNDS = {
  latMin: 43.30,
  latMax: 44.20,
  lonMin: -80.00,
  lonMax: -78.70,
};

// Toronto center for distance calculations
const TORONTO_CENTER = {
  lat: 43.6532,
  lon: -79.3832,
};

/**
 * Calculates distance between two points in kilometers using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filters earthquakes based on location criteria
 * - All events in GTA bounding box
 * - Events within 150km of Toronto (broader Ontario area)
 */
function filterEarthquakes(events: any[]) {
  return events.filter(event => {
    const lat = event.latitude;
    const lon = event.longitude;

    if (lat === null || lon === null) return false;

    // Check if in GTA bounding box
    const inGTA =
      lat >= GTA_BOUNDS.latMin && lat <= GTA_BOUNDS.latMax &&
      lon >= GTA_BOUNDS.lonMin && lon <= GTA_BOUNDS.lonMax;

    if (inGTA) return true;

    // Check if within 150km of Toronto
    const distance = calculateDistance(lat, lon, TORONTO_CENTER.lat, TORONTO_CENTER.lon);
    return distance <= 150;
  });
}

/**
 * Classifies earthquake alert level based on magnitude and location
 */
function classifyEarthquake(event: any): string {
  const mag = event.magnitude;
  const lat = event.latitude;
  const lon = event.longitude;

  const inGTA =
    lat >= GTA_BOUNDS.latMin && lat <= GTA_BOUNDS.latMax &&
    lon >= GTA_BOUNDS.lonMin && lon <= GTA_BOUNDS.lonMax;

  const distance = calculateDistance(lat, lon, TORONTO_CENTER.lat, TORONTO_CENTER.lon);

  // M3.0+ in GTA = PRIORITY
  if (inGTA && mag >= 3.0) {
    return 'PRIORITY';
  }

  // M2.0+ within 50km = ROUTINE
  if (distance <= 50 && mag >= 2.0) {
    return 'ROUTINE';
  }

  // M1.5+ within 150km = INFO
  if (distance <= 150 && mag >= 1.5) {
    return 'INFO';
  }

  return 'NONE';
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getPublicCorsHeaders() });
  }

  try {
    const response = await fetch(NRCAN_API_URL, {
      signal: AbortSignal.timeout(15000),
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`NRCan API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.locations)) {
      throw new Error('Invalid NRCan response format');
    }

    // Filter earthquakes for GTA/Ontario region
    const filtered = filterEarthquakes(data.locations);

    // Classify each earthquake
    const classified = filtered.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      magnitude: event.magnitude,
      depth: event.depth,
      latitude: event.latitude,
      longitude: event.longitude,
      location: event.location,
      felt: event.felt || false,
      quality: event.quality,
      alertLevel: classifyEarthquake(event),
    }));

    // Sort by timestamp (newest first)
    classified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return jsonResponse(
      {
        fetchedAt: new Date().toISOString(),
        earthquakes: classified,
        gtaBounds: GTA_BOUNDS,
        total: classified.length,
        priorityCount: classified.filter(e => e.alertLevel === 'PRIORITY').length,
        routineCount: classified.filter(e => e.alertLevel === 'ROUTINE').length,
      },
      200,
      {
        'Cache-Control': `s-maxage=${CACHE_TTL}, stale-while-revalidate=${Math.floor(CACHE_TTL / 2)}`,
        ...getPublicCorsHeaders(),
      }
    );
  } catch (error) {
    console.error('[Earthquakes] Fetch failed:', error);

    return jsonResponse(
      {
        error: 'Earthquake data temporarily unavailable',
        message: error.message,
        earthquakes: [],
        total: 0,
        priorityCount: 0,
        routineCount: 0,
      },
      503,
      {
        'Cache-Control': 'no-cache, no-store',
        ...getPublicCorsHeaders(),
      }
    );
  }
}