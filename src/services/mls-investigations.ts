/**
 * Service: ML&S Investigation Activity
 * Manages Municipal Licensing & Standards investigation data
 */

import { createCircuitBreaker } from '@/utils/circuit-breaker';
import { getHydratedData } from '@/utils/hydration';
import type { MLSInvestigation } from '@/config/mls-investigations';

const API_URL = '/api/mls-investigations';

/**
 * Circuit breaker for ML&S investigations API calls
 */
const breaker = createCircuitBreaker({
  failureThreshold: 3,
  timeout: 10000,
  resetTimeout: 60000,
});

/**
 * Fetch ML&S investigations from API
 */
async function fetchMLSInvestigations(): Promise<MLSInvestigation[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch ML&S investigations: ${response.status}`);
  }

  const geojson = await response.json();

  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('Invalid ML&S investigations data: missing features array');
  }

  return geojson.features.map((feature: any) => ({
    id: feature.properties.id,
    type: feature.properties.type,
    status: feature.properties.status,
    date: feature.properties.date,
    address: feature.properties.address,
    geometry: feature.geometry,
  }));
}

/**
 * Get ML&S investigations data with circuit breaker and hydration
 */
export async function getMLSInvestigations(): Promise<MLSInvestigation[]> {
  return breaker.execute(async () => {
    return getHydratedData('mls-investigations', fetchMLSInvestigations);
  });
}

/**
 * Reset the circuit breaker
 */
export function resetMLSInvestigationsBreaker(): void {
  breaker.reset();
}