/**
 * Urban Heat Island service — fetches Toronto heat zone data via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { UrbanHeatZone } from '@/config/urban-heat';

const URBAN_HEAT_API_URL = '/api/urban-heat';

const breaker = createCircuitBreaker<UrbanHeatZone[]>({
  name: 'UrbanHeat',
  cacheTtlMs: 60 * 60 * 1000, // 1 hour
  persistCache: true,
});

const emptyFallback: UrbanHeatZone[] = [];

/**
 * Fetch urban heat island zones
 */
export async function fetchUrbanHeat(): Promise<UrbanHeatZone[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('urban-heat') as UrbanHeatZone[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${URBAN_HEAT_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Urban Heat API error: ${res.status}`);
      }
      const json: { zones: UrbanHeatZone[]; total: number; lastUpdated: string; source: string } = await res.json();
      return json.zones || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Urban Heat data:', error);
    return emptyFallback;
  }
}

/**
 * Get heat zones by risk level
 */
export function getZonesByRiskLevel(zones: UrbanHeatZone[], riskLevel: string): UrbanHeatZone[] {
  return zones.filter(z => z.riskLevel === riskLevel);
}

/**
 * Get average heat index
 */
export function getAverageHeatIndex(zones: UrbanHeatZone[]): number {
  if (zones.length === 0) return 0;
  const sum = zones.reduce((acc, z) => acc + z.heatIndex, 0);
  return Math.round(sum / zones.length);
}

/**
 * Get zone count by risk level
 */
export function getZoneCountByRiskLevel(zones: UrbanHeatZone[]): Record<string, number> {
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const zone of zones) {
    counts[zone.riskLevel] = (counts[zone.riskLevel] || 0) + 1;
  }
  return counts;
}