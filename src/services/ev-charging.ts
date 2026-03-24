import { createCircuitBreaker } from '@/utils';
import { toApiUrl } from '@/services/runtime';

export interface EVChargingStation {
  id: string;
  stationName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  stationPhone: string;
  status: string;
  accessDaysTime: string;
  groupsWithAccessCode: string;
  cardsAccepted: string;
  evLevel1EvseNum: number;
  evLevel2EvseNum: number;
  evDcFastCount: number;
  evOtherEvse: number;
  evNetwork: string;
  evNetworkWeb: string;
  geocodeStatus: string;
  latitudeInput: number;
  longitudeInput: number;
  idInput: string;
  updatedAt: string;
}

export interface EVChargingData {
  stations: EVChargingStation[];
  total: number;
  connectorTypeCounts: Record<string, number>;
  networkCounts: Record<string, number>;
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Circuit breaker with cache
const breaker = createCircuitBreaker<EVChargingData>({
  name: 'EVCharging',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

/**
 * Toronto area bounds (lat/lng)
 */
const TORONTO_BOUNDS = {
  minLat: 43.5,
  maxLat: 43.8,
  minLon: -79.6,
  maxLon: -79.1,
};

/**
 * Checks if a station is in the Toronto area
 */
function isInToronto(station: EVChargingStation): boolean {
  const { latitude, longitude, zip } = station;

  // Check lat/lng bounds
  if (latitude >= TORONTO_BOUNDS.minLat && latitude <= TORONTO_BOUNDS.maxLat &&
      longitude >= TORONTO_BOUNDS.minLon && longitude <= TORONTO_BOUNDS.maxLon) {
    return true;
  }

  // Check postal code (M* is Toronto)
  if (zip && zip.toUpperCase().startsWith('M')) {
    return true;
  }

  return false;
}

/**
 * Fetches EV charging stations from NREL API
 */
export async function fetchEVChargingStations(): Promise<EVChargingData> {
  const response = await breaker.execute(async () => {
    const url = toApiUrl('/api/ev-charging');
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const json = await resp.json();

    // API returns { stations: [...], total: N, ... }
    const stations: EVChargingStation[] = json.stations || json || [];

    // Filter to Toronto area
    const torontoStations = stations.filter(isInToronto);

    // Calculate connector type counts
    const connectorTypeCounts: Record<string, number> = {};
    let level2Count = 0;
    let dcFastCount = 0;
    let level1Count = 0;
    let otherCount = 0;

    for (const station of torontoStations) {
      if (station.evLevel2EvseNum > 0) level2Count += station.evLevel2EvseNum;
      if (station.evDcFastCount > 0) dcFastCount += station.evDcFastCount;
      if (station.evLevel1EvseNum > 0) level1Count += station.evLevel1EvseNum;
      if (station.evOtherEvse > 0) otherCount += station.evOtherEvse;
    }

    connectorTypeCounts['Level 2'] = level2Count;
    connectorTypeCounts['DC Fast'] = dcFastCount;
    connectorTypeCounts['Level 1'] = level1Count;
    connectorTypeCounts['Other'] = otherCount;

    // Calculate network counts
    const networkCounts: Record<string, number> = {};
    for (const station of torontoStations) {
      const network = station.evNetwork || 'Unknown';
      networkCounts[network] = (networkCounts[network] || 0) + 1;
    }

    return {
      stations: torontoStations,
      total: torontoStations.length,
      connectorTypeCounts,
      networkCounts,
    };
  }, { stations: [], total: 0, connectorTypeCounts: {}, networkCounts: {} });

  return response;
}

/**
 * Gets color for a connector type
 */
export function getConnectorColor(connectorType: string): string {
  const normalized = connectorType?.toLowerCase() || '';

  if (normalized.includes('dc fast') || normalized.includes('dcfast') || normalized.includes('dc')) {
    return '#ef4444'; // red
  }
  if (normalized.includes('level 2') || normalized.includes('level2') || normalized.includes('l2')) {
    return '#3b82f6'; // blue
  }
  if (normalized.includes('level 1') || normalized.includes('level1') || normalized.includes('l1')) {
    return '#10b981'; // green
  }

  return '#6b7280'; // gray
}

/**
 * Gets radius for a station based on connector count
 */
export function getStationRadius(station: EVChargingStation): number {
  const totalConnectors = station.evLevel2EvseNum + station.evDcFastCount +
                          station.evLevel1EvseNum + station.evOtherEvse;

  // Scale radius by connector count (min 5, max 20)
  return Math.max(5, Math.min(20, 5 + totalConnectors * 1.5));
}

/**
 * Gets primary connector type for a station
 */
export function getPrimaryConnectorType(station: EVChargingStation): string {
  if (station.evDcFastCount > 0) return 'DC Fast';
  if (station.evLevel2EvseNum > 0) return 'Level 2';
  if (station.evLevel1EvseNum > 0) return 'Level 1';
  return 'Other';
}