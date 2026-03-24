/**
 * Lake Ontario Level service — fetches water level data via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { WaterLevelReading, WaterLevelSummary } from '@/config/lake-ontario-level';
import { summarizeWaterLevel } from '@/config/lake-ontario-level';

const LAKE_ONTARIO_LEVEL_API_URL = '/api/lake-ontario-level';

const breaker = createCircuitBreaker<WaterLevelReading[]>({
  name: 'LakeOntarioLevel',
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
  persistCache: true,
});

const emptyFallback: WaterLevelReading[] = [];

/**
 * Fetch lake Ontario water level readings
 */
export async function fetchLakeOntarioLevel(): Promise<WaterLevelReading[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('lake-ontario-level') as WaterLevelReading[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${LAKE_ONTARIO_LEVEL_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Lake Ontario Level API error: ${res.status}`);
      }
      const json: { readings: WaterLevelReading[]; total: number; lastUpdated: string } = await res.json();
      return json.readings || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Lake Ontario Level data:', error);
    return emptyFallback;
  }
}

/**
 * Get summary statistics
 */
export function getLakeOntarioLevelSummary(readings: WaterLevelReading[]): WaterLevelSummary {
  return summarizeWaterLevel(readings);
}