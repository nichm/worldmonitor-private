import { createCircuitBreaker } from '@/utils';
import { toApiUrl } from '@/services/runtime';
import { dispatchAlert } from '@/services/breaking-news-alerts';
import type { BreakingAlert } from '@/services/breaking-news-alerts';

export interface TorontoFireIncident {
  id: string;
  time: string;
  address: string;
  alarm: number;
  incidentType: string;
  lat: number | null;
  lon: number | null;
  timestamp: number;
}

export interface TorontoFireResponse {
  incidents: TorontoFireIncident[];
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const GEOCODE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Circuit breaker with cache
const breaker = createCircuitBreaker<TorontoFireResponse>({
  name: 'TorontoFire',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// In-memory geocode cache
const geocodeCache = new Map<string, { data: { lat: number; lon: number } | null; timestamp: number }>();

// Track already-dispatched incident IDs to avoid duplicates
const dispatchedIncidents = new Set<string>();
const DISPATCHED_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Rate limiting for geocoding (1 req/sec)
let lastGeocodeTime = 0;
const GEOCOOODE_DELAY_MS = 1100;

/**
 * Geocodes a Toronto address using the geocoding edge function
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  const cacheKey = address.toLowerCase().trim();

  // Check cache
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GEOCODE_CACHE_TTL_MS) {
    return cached.data;
  }

  // Rate limiting
  const now = Date.now();
  const timeSinceLastGeocode = now - lastGeocodeTime;
  if (timeSinceLastGeocode < GEOCOOODE_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, GEOCOOODE_DELAY_MS - timeSinceLastGeocode));
  }

  try {
    const url = toApiUrl(`/api/toronto-geocode?address=${encodeURIComponent(address)}`);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.lat !== null && data.lon !== null) {
      const result = { lat: data.lat, lon: data.lon };
      geocodeCache.set(cacheKey, { data: result, timestamp: now });
      lastGeocodeTime = Date.now();
      return result;
    }

    // Cache negative result
    geocodeCache.set(cacheKey, { data: null, timestamp: now });
    lastGeocodeTime = Date.now();
    return null;
  } catch (error) {
    console.error('[Toronto Fire] Geocode failed for address:', address, error);
    return null;
  }
}

/**
 * Cleans up old dispatch tracking entries
 */
function cleanupDispatchedEntries() {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const id of dispatchedIncidents) {
    const timestamp = parseInt(id.split('-')[2] || '0', 10);
    if (now - timestamp > DISPATCHED_TTL_MS) {
      toDelete.push(id);
    }
  }

  for (const id of toDelete) {
    dispatchedIncidents.delete(id);
  }
}

/**
 * Dispatches breaking news for high-alarm incidents
 */
function dispatchHighAlarmIncidents(incidents: TorontoFireIncident[]): void {
  cleanupDispatchedEntries();

  const highAlarmIncidents = incidents.filter(inc => inc.alarm >= 3);

  for (const incident of highAlarmIncidents) {
    const dispatchId = `toronto-fire-${incident.incidentType}-${incident.timestamp}`;

    if (dispatchedIncidents.has(dispatchId)) {
      continue;
    }

    dispatchedIncidents.add(dispatchId);

    const alert: BreakingAlert = {
      id: dispatchId,
      headline: `${incident.alarm}-Alarm ${incident.incidentType}`,
      source: 'Toronto Fire Services',
      link: 'https://www.toronto.ca/fire/cadinfo/livecad.htm',
      threatLevel: incident.alarm >= 4 ? 'critical' : 'high',
      timestamp: new Date(incident.timestamp),
      origin: 'keyword_spike',
    };

    dispatchAlert(alert);
  }
}

/**
 * Fetches Toronto Fire CAD incidents
 */
export async function fetchTorontoFireIncidents(): Promise<TorontoFireIncident[]> {
  const response = await breaker.execute(async () => {
    const url = toApiUrl('/api/toronto-fire');
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    return await resp.json();
  }, { incidents: [] });

  // Geocode addresses that don't have coordinates yet
  const incidentsWithCoords = await Promise.all(
    response.incidents.map(async (incident: any) => {
      const id = `${incident.address}-${incident.timestamp}`;

      return {
        id,
        time: incident.time,
        address: incident.address,
        alarm: incident.alarm,
        incidentType: incident.incidentType,
        lat: null,
        lon: null,
        timestamp: incident.timestamp,
      };
    })
  );

  // Geocode incidents one at a time to respect rate limit
  for (const incident of incidentsWithCoords) {
    if (incident.lat === null && incident.lon === null) {
      const coords = await geocodeAddress(incident.address);
      if (coords) {
        incident.lat = coords.lat;
        incident.lon = coords.lon;
      }
    }
  }

  // Dispatch breaking news for high-alarm incidents
  dispatchHighAlarmIncidents(incidentsWithCoords);

  return incidentsWithCoords;
}

/**
 * Gets the color for an alarm level
 */
export function getAlarmColor(alarm: number): number[] {
  switch (true) {
    case alarm >= 5:
      return [0, 0, 0]; // Black
    case alarm >= 4:
      return [100, 0, 0]; // Dark red
    case alarm >= 3:
      return [255, 0, 0]; // Red
    case alarm >= 2:
      return [255, 165, 0]; // Orange
    default:
      return [255, 255, 0]; // Yellow
  }
}

/**
 * Gets incident types present in the data
 */
export function getIncidentTypes(incidents: TorontoFireIncident[]): string[] {
  const types = new Set(incidents.map(inc => inc.incidentType));
  return Array.from(types).sort();
}

/**
 * Converts incidents to map layer format
 */
export function incidentsToMapLayer(incidents: TorontoFireIncident[]): TorontoFireIncident[] {
  return incidents.filter(inc => inc.lat !== null && inc.lon !== null);
}