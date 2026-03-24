/**
 * Lake Ontario Water Level at Toronto
 * Source: NOAA Great Lakes Data — station 9063083 (Toronto)
 * Geometry: Single point with water level readings
 */

export interface WaterLevelReading {
  id: string;
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  levelMeters: number; // Water level in meters (IGLD)
  levelFt: number; // Water level in feet
  timestamp: string; // ISO datetime
  quality: 'preliminary' | 'verified';
}

export const LAKE_ONTARIO_LEVEL_URL =
  'https://tidesandcurrents.noaa.gov/api/prod/datagetter?station=9063083&product=water_level&datum=IGLD&units=metric&time_zone=gmt&application=worldmonitor&format=json';

export let waterLevelReadings: WaterLevelReading[] = [];

// Toronto waterfront coordinates
const TORONTO_WATERFRONT = {
  lat: 43.6426,
  lon: -79.3871,
};

function parseReading(feature: any, index: number): WaterLevelReading | null {
  if (!feature || feature.v === undefined) return null;

  const levelMeters = Number(feature.v);
  const levelFt = levelMeters * 3.28084; // Convert to feet

  return {
    id: `water-level-${index}`,
    stationId: '9063083',
    stationName: 'Toronto',
    latitude: TORONTO_WATERFRONT.lat,
    longitude: TORONTO_WATERFRONT.lon,
    levelMeters,
    levelFt,
    timestamp: feature.t || new Date().toISOString(),
    quality: feature.s || 'preliminary',
  };
}

export async function fetchLakeOntarioLevel(): Promise<WaterLevelReading[]> {
  try {
    const res = await fetch(LAKE_ONTARIO_LEVEL_URL);
    if (!res.ok) throw new Error(`Lake Ontario Level API error: ${res.status}`);
    const json = await res.json();

    const data = json.data || [];
    const readings: WaterLevelReading[] = [];

    // Take the most recent reading
    if (data.length > 0) {
      const reading = parseReading(data[0], 0);
      if (reading) readings.push(reading);
    }

    waterLevelReadings = readings;
    return readings;
  } catch (error) {
    console.error('[App] Lake Ontario Level fetch failed:', error);
    return [];
  }
}

/** Derive summary stats */
export interface WaterLevelSummary {
  currentLevelMeters: number;
  currentLevelFt: number;
  timestamp: string;
  trend: number; // meters change from previous reading (if available)
  historicalHighMeters: number; // ~75.5m IGLD (record high 2017)
  historicalLowMeters: number; // ~73.5m IGLD (record low)
  isAboveAverage: boolean; // Above long-term average (~74.5m)
}

export function summarizeWaterLevel(readings: WaterLevelReading[]): WaterLevelSummary {
  if (readings.length === 0) {
    return {
      currentLevelMeters: 0,
      currentLevelFt: 0,
      timestamp: new Date().toISOString(),
      trend: 0,
      historicalHighMeters: 75.5,
      historicalLowMeters: 73.5,
      isAboveAverage: false,
    };
  }

  const latest = readings[0];
  const longTermAverage = 74.5; // meters IGLD

  return {
    currentLevelMeters: latest.levelMeters,
    currentLevelFt: latest.levelFt,
    timestamp: latest.timestamp,
    trend: readings.length > 1 ? latest.levelMeters - readings[1].levelMeters : 0,
    historicalHighMeters: 75.5, // Record high 2017
    historicalLowMeters: 73.5, // Record low
    isAboveAverage: latest.levelMeters > longTermAverage,
  };
}