import { createCircuitBreaker } from "@/utils";
import { toApiUrl } from "@/services/runtime";
import { dispatchAlert } from "@/services/breaking-news-alerts";

export interface AircraftData {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  timePosition: number | null;
  timeVelocity: number | null;
  longitude: number;
  latitude: number;
  altitude: number | null;
  onGround: boolean;
  velocity: number | null;
  heading: number | null;
  verticalRate: number | null;
  squawk: string | null;
}

export interface AirTrafficResponse {
  fetchedAt: string;
  aircraft: AircraftData[];
  total: number;
  airborneCount: number;
  groundCount: number;
  emergencyCount: number;
  emergencies: Array<{
    icao24: string;
    callsign: string | null;
    squawk: string;
    latitude: number;
    longitude: number;
    altitude: number | null;
    onGround: boolean;
  }>;
  gtaBounds: {
    lamin: number;
    lamax: number;
    lomin: number;
    lomax: number;
  };
  error?: string;
  message?: string;
}

const CACHE_TTL_MS = 90 * 1000; // 90 seconds (balance freshness vs credit budget)

// Circuit breaker with cache
const breaker = createCircuitBreaker<AirTrafficResponse>({
  name: "TorontoAirTraffic",
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// Emergency squawk codes
const EMERGENCY_SQUAWKS = ["7500", "7600", "7700"];

// Squawk code meanings
const SQUAWK_MEANINGS: Record<string, string> = {
  "7500": "HIJACK",
  "7600": "LOSS OF COMMS",
  "7700": "EMERGENCY",
};

// Track dispatched emergency IDs to avoid duplicates
const dispatchedEmergencies = new Set<string>();
const DISPATCHED_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Cleans up old dispatch tracking entries
 */
function cleanupDispatchedEntries(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const id of dispatchedEmergencies) {
    // Extract timestamp from ID
    const timestampMatch = id.match(/(\d+)$/);
    if (timestampMatch?.[1]) {
      const dispatchedTime = parseInt(timestampMatch[1], 10);
      if (now - dispatchedTime > DISPATCHED_TTL_MS) {
        toDelete.push(id);
      }
    }
  }

  for (const id of toDelete) {
    dispatchedEmergencies.delete(id);
  }
}

/**
 * Checks if a squawk code is an emergency
 */
function isEmergencySquawk(squawk: string | null): boolean {
  if (!squawk) return false;
  return EMERGENCY_SQUAWKS.includes(squawk.padStart(4, "0"));
}

/**
 * Gets the meaning of a squawk code
 */
function getSquawkMeaning(squawk: string | null): string | null {
  if (!squawk) return null;
  const normalized = squawk.padStart(4, "0");
  return SQUAWK_MEANINGS[normalized] || null;
}

/**
 * Dispatches breaking news for emergency aircraft
 */
function checkEmergencyAlerts(response: AirTrafficResponse): void {
  cleanupDispatchedEntries();

  for (const emergency of response.emergencies) {
    const dispatchId = `${emergency.icao24}-${emergency.squawk}-${Date.now()}`;

    if (dispatchedEmergencies.has(dispatchId)) {
      continue;
    }

    dispatchedEmergencies.add(dispatchId);

    const meaning = getSquawkMeaning(emergency.squawk);
    const callsign = emergency.callsign || "Unknown";
    const location = `${emergency.latitude.toFixed(4)}, ${emergency.longitude.toFixed(4)}`;

    const headline = `Aircraft Emergency - ${meaning} - ${callsign} (${location})`;

    const alert = {
      id: dispatchId,
      headline,
      source: "OpenSky Network",
      link: "https://opensky-network.org/",
      threatLevel: "critical" as const,
      timestamp: new Date(),
      origin: "keyword_spike" as const,
    };

    dispatchAlert(alert);
  }
}

/**
 * Fetches Toronto/GTA air traffic data from OpenSky Network
 * Requires OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET environment variables
 */
export async function fetchTorontoAirTraffic(): Promise<AirTrafficResponse> {
  const response = await breaker.execute(
    async () => {
      const url = toApiUrl("/api/toronto-airtraffic");
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(20000),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.json();
    },
    {
      error: "Service unavailable",
      aircraft: [],
      total: 0,
      airborneCount: 0,
      groundCount: 0,
      emergencyCount: 0,
      emergencies: [],
      gtaBounds: { lamin: 43.4, lamax: 44.0, lomin: -79.8, lomax: -78.9 },
    },
  );

  // Check for emergency alerts if we have valid data
  if (!response.error && response.emergencies.length > 0) {
    checkEmergencyAlerts(response);
  }

  return response;
}

/**
 * Gets the color for an aircraft based on its status
 * Blue = airborne, Grey = ground, Red = emergency
 */
export function getAircraftColor(aircraft: AircraftData): number[] {
  // Check for emergency first
  if (aircraft.squawk && isEmergencySquawk(aircraft.squawk)) {
    return [255, 0, 0]; // Red
  }

  // Otherwise check airborne/ground status
  if (aircraft.onGround) {
    return [120, 120, 120]; // Grey
  } else {
    return [0, 100, 255]; // Blue
  }
}

/**
 * Converts aircraft data to map layer format
 */
export function aircraftToMapLayer(aircraft: AircraftData[]): Array<{
  id: string;
  lat: number;
  lon: number;
  callsign: string | null;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  onGround: boolean;
  squawk: string | null;
  color: number[];
  isEmergency: boolean;
}> {
  return aircraft.map((ac) => ({
    id: ac.icao24,
    lat: ac.latitude,
    lon: ac.longitude,
    callsign: ac.callsign,
    altitude: ac.altitude,
    velocity: ac.velocity,
    heading: ac.heading,
    onGround: ac.onGround,
    squawk: ac.squawk,
    color: getAircraftColor(ac),
    isEmergency: isEmergencySquawk(ac.squawk),
  }));
}

/**
 * Gets emergency aircraft for summary
 */
export function getEmergencyAircraft(aircraft: AircraftData[]): AircraftData[] {
  return aircraft.filter((ac) => isEmergencySquawk(ac.squawk));
}

/**
 * Gets airborne aircraft count
 */
export function getAirborneCount(aircraft: AircraftData[]): number {
  return aircraft.filter((ac) => !ac.onGround).length;
}

/**
 * Formats altitude for display
 */
export function formatAltitude(altitude: number | null): string {
  if (altitude === null) return "N/A";
  return `${Math.round(altitude)} ft`;
}

/**
 * Formats velocity for display
 */
export function formatVelocity(velocity: number | null): string {
  if (velocity === null) return "N/A";
  return `${Math.round(velocity)} kts`;
}

/**
 * Formats heading for display
 */
export function formatHeading(heading: number | null): string {
  if (heading === null) return "N/A";
  return `${Math.round(heading)}°`;
}

/**
 * Formats squawk code for display
 */
export function formatSquawk(squawk: string | null): string {
  if (!squawk) return "----";
  return squawk.padStart(4, "0");
}
