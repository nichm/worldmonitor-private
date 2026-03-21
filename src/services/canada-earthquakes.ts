import { createCircuitBreaker } from '@/utils';
import { toApiUrl } from '@/services/runtime';
import { dispatchAlert } from '@/services/breaking-news-alerts';

export interface EarthquakeEvent {
  id: string;
  timestamp: string;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  location: string;
  felt: boolean;
  quality: string;
  alertLevel: 'PRIORITY' | 'ROUTINE' | 'INFO' | 'NONE';
}

export interface EarthquakeResponse {
  fetchedAt: string;
  earthquakes: EarthquakeEvent[];
  gtaBounds: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  };
  total: number;
  priorityCount: number;
  routineCount: number;
  error?: string;
  message?: string;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Circuit breaker with cache
const breaker = createCircuitBreaker<EarthquakeResponse>({
  name: 'CanadaEarthquakes',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// Track dispatched earthquake IDs to avoid duplicates
const dispatchedEvents = new Set<string>();
const DISPATCHED_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cleans up old dispatch tracking entries
 */
function cleanupDispatchedEntries(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const id of dispatchedEvents) {
    // Extract timestamp from ID (format: YYYY-MM-DDTHH:MM:SS...)
    const timestampMatch = id.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    if (timestampMatch && timestampMatch[1]) {
      const eventTime = new Date(timestampMatch[1]).getTime();
      if (now - eventTime > DISPATCHED_TTL_MS) {
        toDelete.push(id);
      }
    }
  }

  for (const id of toDelete) {
    dispatchedEvents.delete(id);
  }
}

/**
 * Dispatches breaking news for significant earthquakes
 */
function checkEarthquakeAlerts(events: EarthquakeEvent[]): void {
  cleanupDispatchedEntries();

  for (const event of events) {
    if (event.alertLevel !== 'PRIORITY' && event.alertLevel !== 'ROUTINE') {
      continue;
    }

    const dispatchId = `${event.timestamp}-${event.location}`;

    if (dispatchedEvents.has(dispatchId)) {
      continue;
    }

    dispatchedEvents.add(dispatchId);

    const headline = event.alertLevel === 'PRIORITY'
      ? `M${event.magnitude.toFixed(1)} Earthquake in GTA - ${event.location}`
      : `M${event.magnitude.toFixed(1)} Earthquake Detected - ${event.location}`;

    const alert = {
      id: `earthquake-${event.id}`,
      headline,
      source: 'Earthquakes Canada (NRCan)',
      link: 'https://www.earthquakescanada.nrcan.gc.ca/',
      threatLevel: event.alertLevel === 'PRIORITY' ? ('high' as const) : ('critical' as const),
      timestamp: new Date(event.timestamp),
      origin: 'keyword_spike' as const,
    };

    dispatchAlert(alert);
  }
}

/**
 * Fetches recent Canadian earthquakes filtered for GTA/Ontario
 */
export async function fetchCanadaEarthquakes(): Promise<EarthquakeResponse> {
  const response = await breaker.execute(async () => {
    const url = toApiUrl('/api/canada-earthquakes');
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    return await resp.json();
  }, {
    error: 'Service unavailable',
    earthquakes: [],
    gtaBounds: { latMin: 43.30, latMax: 44.20, lonMin: -80.00, lonMax: -78.70 },
    total: 0,
    priorityCount: 0,
    routineCount: 0,
  });

  // Check for alerts if we have valid data
  if (!response.error && response.earthquakes.length > 0) {
    checkEarthquakeAlerts(response.earthquakes);
  }

  return response;
}

/**
 * Gets the color for an earthquake magnitude
 */
export function getMagnitudeColor(magnitude: number): number[] {
  if (magnitude >= 5.0) {
    return [139, 0, 0]; // Dark red
  } else if (magnitude >= 4.0) {
    return [255, 0, 0]; // Red
  } else if (magnitude >= 3.0) {
    return [255, 140, 0]; // Orange
  } else if (magnitude >= 2.0) {
    return [255, 200, 0]; // Yellow
  } else {
    return [100, 150, 100]; // Green
  }
}

/**
 * Gets the size (radius) for map markers based on magnitude
 */
export function getMagnitudeSize(magnitude: number): number {
  const baseSize = 10;
  const multiplier = magnitude * 2;
  return baseSize + multiplier;
}

/**
 * Converts earthquake events to map layer format
 */
export function earthquakesToMapLayer(events: EarthquakeEvent[]): Array<{
  id: string;
  lat: number;
  lon: number;
  magnitude: number;
  depth: number;
  location: string;
  timestamp: Date;
  color: number[];
  size: number;
  alertLevel: string;
}> {
  return events.map(event => ({
    id: event.id,
    lat: event.latitude,
    lon: event.longitude,
    magnitude: event.magnitude,
    depth: event.depth,
    location: event.location,
    timestamp: new Date(event.timestamp),
    color: getMagnitudeColor(event.magnitude),
    size: getMagnitudeSize(event.magnitude),
    alertLevel: event.alertLevel,
  }));
}

/**
 * Gets significant earthquakes for summary
 */
export function getSignificantEarthquakes(events: EarthquakeEvent[]): EarthquakeEvent[] {
  return events.filter(e => e.alertLevel === 'PRIORITY' || e.alertLevel === 'ROUTINE');
}