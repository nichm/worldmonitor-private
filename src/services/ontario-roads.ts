import { startSmartPollLoop, toApiUrl, type SmartPollLoopHandle } from '@/services/runtime';
import { dispatchAlert } from './breaking-news-alerts';

// GTA highways to monitor
const GTA_HIGHWAYS = ['400', '401', '403', '404', '407', '427', 'QEW'];

// Geographic bounding box for GTA (latitude, longitude in WGS84)
const GTA_BOUNDS = {
  minLat: 43.3,
  maxLat: 44.1,
  minLon: -80.0,
  maxLon: -78.8,
};

export interface OntarioRoadIncident {
  id: string;
  roadName: string;
  description: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR' | 'UNKNOWN';
  latitude: number | null;
  longitude: number | null;
  startTime: string;
  lastUpdated: string;
  county: string | null;
  type: string | null;
}

export interface OntarioRoadsResponse {
  incidents: OntarioRoadIncident[];
  timestamp: string;
  filteredHighways: string[];
  error?: string;
}

let cachedResponse: OntarioRoadsResponse | null = null;
let lastFetchAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5-minute cache
let pollingLoop: SmartPollLoopHandle | null = null;
let updateCallbacks: Array<(data: OntarioRoadsResponse) => void> = [];

function isGtaHighway(roadName: string): boolean {
  if (!roadName) return false;
  const name = roadName.toUpperCase();
  return GTA_HIGHWAYS.some(hw => name.includes(`HWY-${hw}`) || name.includes(`${hw}`));
}

function isWithinGtaBounds(lat: number | null, lon: number | null): boolean {
  if (lat === null || lon === null) return false;
  return lat >= GTA_BOUNDS.minLat && lat <= GTA_BOUNDS.maxLat &&
         lon >= GTA_BOUNDS.minLon && lon <= GTA_BOUNDS.maxLon;
}

function shouldIncludeIncident(incident: OntarioRoadIncident): boolean {
  // Include if it's on a GTA highway
  if (isGtaHighway(incident.roadName)) return true;
  // Also include if it's within GTA geographic bounds
  if (isWithinGtaBounds(incident.latitude, incident.longitude)) return true;
  return false;
}

/**
 * Dispatch breaking news alert for Critical severity incidents on 400 or 401
 */
function checkForBreakingAlerts(incidents: OntarioRoadIncident[]): void {
  // Only look for Critical incidents on 400 or 401 highways
  const criticalIncidents = incidents.filter(inc =>
    inc.severity === 'CRITICAL' &&
    (inc.roadName.toUpperCase().includes('400') || inc.roadName.toUpperCase().includes('401'))
  );

  for (const incident of criticalIncidents) {
    const alertId = `ontario-roads-${incident.id}`;

    dispatchAlert({
      id: alertId,
      headline: `${incident.roadName}: ${incident.description || incident.type || 'Incident'}`,
      source: 'Ontario 511',
      threatLevel: 'critical',
      timestamp: new Date(incident.startTime),
      origin: 'rss_alert',
    });
  }
}

function getApiUrl(): string {
  return toApiUrl('/api/ontario-511');
}

export async function fetchOntarioRoads(options: { signal?: AbortSignal } = {}): Promise<OntarioRoadsResponse> {
  const now = Date.now();
  if (cachedResponse && now - lastFetchAt < CACHE_TTL) {
    return { ...cachedResponse };
  }

  try {
    const res = await fetch(getApiUrl(), {
      headers: { Accept: 'application/json' },
      signal: options.signal,
    });

    if (!res.ok) {
      return {
        incidents: [],
        timestamp: new Date().toISOString(),
        filteredHighways: GTA_HIGHWAYS,
        error: `HTTP ${res.status}`,
      };
    }

    const rawData: any = await res.json();

    // Parse and filter incidents
    let incidents: OntarioRoadIncident[] = [];

    if (Array.isArray(rawData)) {
      // Assume raw array of incident objects
      incidents = rawData
        .map((raw: any): OntarioRoadIncident => ({
          id: raw.id || raw.event_id || Date.now().toString() + Math.random(),
          roadName: raw.road_name || raw.roadName || raw.RoadName || '',
          description: raw.description || raw.Description || raw.summary || '',
          severity: (raw.severity || raw.Severity || raw.Severity_Code || 'UNKNOWN').toUpperCase(),
          latitude: raw.latitude !== undefined ? Number(raw.latitude) : (raw.Latitude !== undefined ? Number(raw.Latitude) : null),
          longitude: raw.longitude !== undefined ? Number(raw.longitude) : (raw.Longitude !== undefined ? Number(raw.Longitude) : null),
          startTime: raw.start_time || raw.Start_Time || raw.startTime || new Date().toISOString(),
          lastUpdated: raw.last_updated || raw.Last_Updated || raw.lastUpdated || new Date().toISOString(),
          county: raw.county || raw.County || null,
          type: raw.type || raw.Type || raw.event_type || null,
        }))
        .filter(shouldIncludeIncident);
    } else if (rawData.incidents && Array.isArray(rawData.incidents)) {
      incidents = rawData.incidents
        .map((raw: any): OntarioRoadIncident => ({
          id: raw.id || raw.event_id || Date.now().toString() + Math.random(),
          roadName: raw.road_name || raw.roadName || raw.RoadName || '',
          description: raw.description || raw.Description || raw.summary || '',
          severity: (raw.severity || raw.Severity || raw.Severity_Code || 'UNKNOWN').toUpperCase(),
          latitude: raw.latitude !== undefined ? Number(raw.latitude) : (raw.Latitude !== undefined ? Number(raw.Latitude) : null),
          longitude: raw.longitude !== undefined ? Number(raw.longitude) : (raw.Longitude !== undefined ? Number(raw.Longitude) : null),
          startTime: raw.start_time || raw.Start_Time || raw.startTime || new Date().toISOString(),
          lastUpdated: raw.last_updated || raw.Last_Updated || raw.lastUpdated || new Date().toISOString(),
          county: raw.county || raw.County || null,
          type: raw.type || raw.Type || raw.event_type || null,
        }))
        .filter(shouldIncludeIncident);
    }

    // Sort by severity (Critical first) then by start time (newest first)
    const severityOrder: Record<string, number> = {
      'CRITICAL': 0,
      'MAJOR': 1,
      'MODERATE': 2,
      'MINOR': 3,
      'UNKNOWN': 4,
    };

    incidents.sort((a, b) => {
      const severityDiff = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
      if (severityDiff !== 0) return severityDiff;
      // Same severity: sort by time (newest first)
      const aTime = new Date(a.startTime).getTime();
      const bTime = new Date(b.startTime).getTime();
      return bTime - aTime;
    });

    const response: OntarioRoadsResponse = {
      incidents,
      timestamp: new Date().toISOString(),
      filteredHighways: GTA_HIGHWAYS,
    };

    cachedResponse = response;
    lastFetchAt = now;

    // Check for breaking news alerts
    if (incidents.length > 0) {
      checkForBreakingAlerts(incidents);
    }

    return response;
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      throw err;
    }
    return {
      incidents: cachedResponse?.incidents || [],
      timestamp: new Date().toISOString(),
      filteredHighways: GTA_HIGHWAYS,
      error: String(err),
    };
  }
}

export function onOntarioRoadsUpdate(cb: (data: OntarioRoadsResponse) => void): void {
  updateCallbacks.push(cb);
}

export function startOntarioRoadsPolling(): void {
  if (pollingLoop?.isActive()) return;
  pollingLoop = startSmartPollLoop(async ({ signal }) => {
    const data = await fetchOntarioRoads({ signal });
    for (const cb of updateCallbacks) cb(data);
  }, {
    intervalMs: 5 * 60 * 1000, // 5 minutes
    pauseWhenHidden: true,
    refreshOnVisible: true,
    runImmediately: true,
  });
}

export function stopOntarioRoadsPolling(): void {
  pollingLoop?.stop();
  pollingLoop = null;
  updateCallbacks = [];
}