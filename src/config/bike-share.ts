/**
 * Bike Share Toronto (GBFS)
 * Source: Toronto Bike Share (PBSC Urban Solutions) GBFS v2.3
 * Geometry: Station points with bike availability
 */

export interface BikeShareStation {
  id: string;
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number; // Total bike capacity
  bikesAvailable: number; // Bikes available for rent
  docksAvailable: number; // Empty docks available
  isInstalled: boolean;
  isRenting: boolean;
  isReturning: boolean;
  lastReported: string; // ISO datetime
}

export const BIKE_SHARE_DISCOVERY_URL = 'https://tor.publicbikesystem.net/ube/gbfs/v2/en/gbfs.json';
export const BIKE_SHARE_STATION_INFO_URL = 'https://tor.publicbikesystem.net/ube/gbfs/v2/en/station_information.json';
export const BIKE_SHARE_STATION_STATUS_URL = 'https://tor.publicbikesystem.net/ube/gbfs/v2/en/station_status.json';

export let bikeShareStations: BikeShareStation[] = [];

function mergeStation(info: any, status: any): BikeShareStation | null {
  if (!info || !status || info.station_id !== status.station_id) return null;

  return {
    id: info.station_id,
    stationId: info.station_id,
    name: info.name || 'Unknown Station',
    latitude: Number(info.lat || 0),
    longitude: Number(info.lon || 0),
    capacity: Number(info.capacity || 0),
    bikesAvailable: Number(status.num_bikes_available || 0),
    docksAvailable: Number(status.num_docks_available || 0),
    isInstalled: status.is_installed === true || status.is_installed === 1,
    isRenting: status.is_renting === true || status.is_renting === 1,
    isReturning: status.is_returning === true || status.is_returning === 1,
    lastReported: status.last_reported || new Date().toISOString(),
  };
}

export async function fetchBikeShare(): Promise<BikeShareStation[]> {
  try {
    // Fetch station information and status in parallel
    const [infoRes, statusRes] = await Promise.all([
      fetch(BIKE_SHARE_STATION_INFO_URL),
      fetch(BIKE_SHARE_STATION_STATUS_URL),
    ]);

    if (!infoRes.ok) throw new Error(`Bike Share Info API error: ${infoRes.status}`);
    if (!statusRes.ok) throw new Error(`Bike Share Status API error: ${statusRes.status}`);

    const infoJson = await infoRes.json();
    const statusJson = await statusRes.json();

    const infoData = infoJson.data?.stations || [];
    const statusData = statusJson.data?.stations || [];

    // Create a map for fast lookup
    const statusMap = new Map(statusData.map((s: any) => [s.station_id, s]));

    const stations: BikeShareStation[] = [];

    for (const info of infoData) {
      const status = statusMap.get(info.station_id);
      if (status) {
        const station = mergeStation(info, status);
        if (station) stations.push(station);
      }
    }

    bikeShareStations = stations;
    return stations;
  } catch (error) {
    console.error('[App] Bike Share fetch failed:', error);
    return [];
  }
}

/** Derive summary stats */
export interface BikeShareSummary {
  totalStations: number;
  activeStations: number; // Stations with isInstalled=true
  totalBikesAvailable: number;
  totalDocksAvailable: number;
  totalCapacity: number;
  emptyStations: number; // 0 bikes available
  fullStations: number; // 0 docks available
  healthyStations: number; // 25-75% availability
  avgAvailabilityPercent: number;
}

export function summarizeBikeShare(stations: BikeShareStation[]): BikeShareSummary {
  const activeStations = stations.filter(s => s.isInstalled);

  let totalBikesAvailable = 0;
  let totalDocksAvailable = 0;
  let totalCapacity = 0;
  let emptyStations = 0;
  let fullStations = 0;
  let healthyStations = 0;
  let totalAvailabilityPercent = 0;

  for (const station of activeStations) {
    totalBikesAvailable += station.bikesAvailable;
    totalDocksAvailable += station.docksAvailable;
    totalCapacity += station.capacity;

    if (station.bikesAvailable === 0) {
      emptyStations++;
    } else if (station.docksAvailable === 0) {
      fullStations++;
    }

    const availabilityPercent = (station.bikesAvailable / station.capacity) * 100;
    if (availabilityPercent >= 25 && availabilityPercent <= 75) {
      healthyStations++;
    }
    totalAvailabilityPercent += availabilityPercent;
  }

  return {
    totalStations: stations.length,
    activeStations: activeStations.length,
    totalBikesAvailable,
    totalDocksAvailable,
    totalCapacity,
    emptyStations,
    fullStations,
    healthyStations,
    avgAvailabilityPercent: activeStations.length > 0 ? totalAvailabilityPercent / activeStations.length : 0,
  };
}