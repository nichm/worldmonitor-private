import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { OntarioHousingTarget } from '@/types';

const HOUSING_API_URL = '/api/ontario-housing';

// Circuit breaker with 1-hour cache
const breaker = createCircuitBreaker<OntarioHousingTarget[]>({
  name: 'OntarioHousing',
  cacheTtlMs: 60 * 60 * 1000,
  persistCache: true,
});

const emptyFallback: OntarioHousingTarget[] = [];

/**
 * Fetch Ontario housing supply progress data (GTA municipalities only)
 */
export async function fetchOntarioHousing(): Promise<OntarioHousingTarget[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('ontarioHousing') as OntarioHousingTarget[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  // Fetch from API with circuit breaker
  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${HOUSING_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Ontario Housing API error: ${res.status}`);
      }
      const data = await res.json();
      return data as OntarioHousingTarget[];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Ontario Housing data:', error);
    return emptyFallback;
  }
}

/**
 * Get housing targets grouped by municipality
 */
export async function getHousingByMunicipality(): Promise<Record<string, OntarioHousingTarget>> {
  const targets = await fetchOntarioHousing();
  const byMunicipality: Record<string, OntarioHousingTarget> = {};

  for (const target of targets) {
    byMunicipality[target.Municipality] = target;
  }

  return byMunicipality;
}

/**
 * Calculate average progress across all GTA municipalities
 */
export async function getAverageProgress(): Promise<number> {
  const targets = await fetchOntarioHousing();
  if (targets.length === 0) return 0;

  const totalProgress = targets.reduce((sum, target) => sum + target.Progress_Percentage, 0);
  return totalProgress / targets.length;
}

/**
 * Get municipalities below a certain progress threshold
 */
export async function getMunicipalitiesBelowThreshold(threshold: number): Promise<OntarioHousingTarget[]> {
  const targets = await fetchOntarioHousing();
  return targets.filter(target => target.Progress_Percentage < threshold);
}

/**
 * Get municipalities above a certain progress threshold
 */
export async function getMunicipalitiesAboveThreshold(threshold: number): Promise<OntarioHousingTarget[]> {
  const targets = await fetchOntarioHousing();
  return targets.filter(target => target.Progress_Percentage >= threshold);
}