/**
 * Cycling Network service — fetches bikeways data via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { CyclingSegment, CyclingNetworkSummary } from '@/config/cycling-network';
import { summarizeCyclingNetwork } from '@/config/cycling-network';

const CYCLING_API_URL = '/api/cycling-network';

const breaker = createCircuitBreaker<CyclingSegment[]>({
  name: 'CyclingNetwork',
  cacheTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  persistCache: true,
});

const emptyFallback: CyclingSegment[] = [];

/**
 * Fetch cycling network segments
 */
export async function fetchCyclingNetwork(): Promise<CyclingSegment[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('cycling-network') as CyclingSegment[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${CYCLING_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Cycling Network API error: ${res.status}`);
      }
      const json: { segments: CyclingSegment[]; total: number; lastUpdated: string } = await res.json();
      return json.segments || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Cycling Network data:', error);
    return emptyFallback;
  }
}

/**
 * Get summary statistics
 */
export function getCyclingNetworkSummary(segments: CyclingSegment[]): CyclingNetworkSummary {
  return summarizeCyclingNetwork(segments);
}