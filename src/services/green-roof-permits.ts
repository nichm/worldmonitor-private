/**
 * Green Roof Permits service — fetches permits via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { GreenRoofPermit, GreenRoofPermitData } from '@/config/green-roof-permits';
import { summarizeGreenRoofPermitData } from '@/config/green-roof-permits';

const GREEN_ROOF_API_URL = '/api/green-roof-permits';

const breaker = createCircuitBreaker<GreenRoofPermit[]>({
  name: 'GreenRoofPermits',
  cacheTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  persistCache: true,
});

const emptyFallback: GreenRoofPermit[] = [];

/**
 * Fetch green roof permits
 */
export async function fetchGreenRoofPermits(): Promise<GreenRoofPermitData> {
  // Try hydrated data first
  const hydrated = getHydratedData('green-roof-permits') as GreenRoofPermit[] | undefined;
  if (hydrated && hydrated.length > 0) {
    return summarizeGreenRoofPermitData(hydrated);
  }

  try {
    const permits = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${GREEN_ROOF_API_URL}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
      if (!res.ok) {
        throw new Error(`Green Roof Permits API error: ${res.status}`);
      }
      const json = await res.json();
      return json.permits || json || [];
    }, emptyFallback);

    return summarizeGreenRoofPermitData(permits);
  } catch (error) {
    console.error('Failed to fetch Green Roof Permits data:', error);
    return {
      permits: [],
      total: 0,
      totalAreaSqm: 0,
      byPermitType: {},
      byYear: {},
    };
  }
}