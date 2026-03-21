import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { DineSafeClosure } from '@/types';

const DINESAFE_API_URL = '/api/toronto-dinesafe';

// Circuit breaker with 1-hour cache
const breaker = createCircuitBreaker<DineSafeClosure[]>({
  name: 'DineSafe',
  cacheTtlMs: 60 * 60 * 1000,
  persistCache: true,
});

const emptyFallback: DineSafeClosure[] = [];

/**
 * Fetch restaurant closures from Toronto DineSafe (last 14 days, ESTABLISHMENT_STATUS = 'Closed')
 */
export async function fetchTorontoDineSafe(): Promise<DineSafeClosure[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('dinesafe') as DineSafeClosure[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  // Fetch from API with circuit breaker
  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${DINESAFE_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`DineSafe API error: ${res.status}`);
      }
      const data = await res.json();
      return data as DineSafeClosure[];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch DineSafe data:', error);
    return emptyFallback;
  }
}

/**
 * Get the most recent closure
 */
export async function getMostRecentDineSafeClosure(): Promise<DineSafeClosure | null> {
  const closures = await fetchTorontoDineSafe();
  return closures.length > 0 ? closures[0] ?? null : null;
}

/**
 * Count closures by severity
 */
export async function getClosuresBySeverity(): Promise<Record<string, number>> {
  const closures = await fetchTorontoDineSafe();
  const severityCounts: Record<string, number> = {};

  for (const closure of closures) {
    const severity = closure.severity || 'Unknown';
    severityCounts[severity] = (severityCounts[severity] || 0) + 1;
  }

  return severityCounts;
}

/**
 * Count closures by action type
 */
export async function getClosuresByAction(): Promise<Record<string, number>> {
  const closures = await fetchTorontoDineSafe();
  const actionCounts: Record<string, number> = {};

  for (const closure of closures) {
    const action = closure.action || 'Unknown';
    actionCounts[action] = (actionCounts[action] || 0) + 1;
  }

  return actionCounts;
}