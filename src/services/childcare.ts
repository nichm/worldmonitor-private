/**
 * Childcare service — fetches childcare centres via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { ChildcareCentre, ChildcareData } from '@/config/childcare';
import { summarizeChildcareData } from '@/config/childcare';

const CHILDCARE_API_URL = '/api/childcare';

const breaker = createCircuitBreaker<ChildcareCentre[]>({
  name: 'Childcare',
  cacheTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  persistCache: true,
});

const emptyFallback: ChildcareCentre[] = [];

/**
 * Fetch childcare centres
 */
export async function fetchChildcareCentres(): Promise<ChildcareData> {
  // Try hydrated data first
  const hydrated = getHydratedData('childcare') as ChildcareCentre[] | undefined;
  if (hydrated && hydrated.length > 0) {
    return summarizeChildcareData(hydrated);
  }

  try {
    const centres = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${CHILDCARE_API_URL}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
      if (!res.ok) {
        throw new Error(`Childcare API error: ${res.status}`);
      }
      const json = await res.json();
      return json.centres || json || [];
    }, emptyFallback);

    return summarizeChildcareData(centres);
  } catch (error) {
    console.error('Failed to fetch Childcare data:', error);
    return {
      centres: [],
      total: 0,
      byAgeGroup: {},
      byOperator: {},
    };
  }
}