/**
 * Ravine Protection service — fetches protection area data via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { RavineProtectionArea, RavineProtectionSummary } from '@/config/ravine-protection';
import { summarizeRavineProtection } from '@/config/ravine-protection';

const RAVINE_API_URL = '/api/ravine-protection';

const breaker = createCircuitBreaker<RavineProtectionArea[]>({
  name: 'RavineProtection',
  cacheTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  persistCache: true,
});

const emptyFallback: RavineProtectionArea[] = [];

/**
 * Fetch ravine protection areas
 */
export async function fetchRavineProtection(): Promise<RavineProtectionArea[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('ravine-protection') as RavineProtectionArea[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${RAVINE_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Ravine Protection API error: ${res.status}`);
      }
      const json: { areas: RavineProtectionArea[]; total: number; lastUpdated: string } = await res.json();
      return json.areas || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Ravine Protection data:', error);
    return emptyFallback;
  }
}

/**
 * Get summary statistics
 */
export function getRavineProtectionSummary(areas: RavineProtectionArea[]): RavineProtectionSummary {
  return summarizeRavineProtection(areas);
}