/**
 * Service: Federal Riding Boundaries
 * Manages federal electoral district boundary data with circuit breaker and hydration
 */

import { createCircuitBreaker } from '@/utils/circuit-breaker';
import { getHydratedData } from '@/utils/hydration';
import type { FederalRiding } from '@/config/federal-ridings';

const API_URL = '/api/federal-ridings';

/**
 * Circuit breaker for federal ridings API calls
 */
const breaker = createCircuitBreaker({
  failureThreshold: 3,
  timeout: 10000,
  resetTimeout: 60000,
});

/**
 * Fetch federal riding boundaries from API
 */
async function fetchFederalRidings(): Promise<FederalRiding[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch federal ridings: ${response.status}`);
  }

  const geojson = await response.json();

  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('Invalid federal ridings data: missing features array');
  }

  // Transform GeoJSON features to FederalRiding objects
  return geojson.features.map((feature: any) => ({
    name: feature.properties.name,
    id: feature.properties.id,
    province: feature.properties.province,
    geometry: feature.geometry,
  }));
}

/**
 * Get federal ridings data with circuit breaker and hydration
 */
export async function getFederalRidings(): Promise<FederalRiding[]> {
  return breaker.execute(async () => {
    return getHydratedData('federal-ridings', fetchFederalRidings);
  });
}

/**
 * Reset the circuit breaker (for testing/recovery)
 */
export function resetFederalRidingsBreaker(): void {
  breaker.reset();
}