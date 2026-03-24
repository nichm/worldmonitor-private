/**
 * Service: Council Votes & Ward Boundaries
 * Manages Toronto ward boundary data
 */

import { createCircuitBreaker } from '@/utils/circuit-breaker';
import { getHydratedData } from '@/utils/hydration';
import type { WardBoundary } from '@/config/ward-boundaries';

const API_URL = '/api/ward-boundaries';

/**
 * Circuit breaker for ward boundaries API calls
 */
const breaker = createCircuitBreaker({
  failureThreshold: 3,
  timeout: 15000,
  resetTimeout: 60000,
});

/**
 * Fetch ward boundaries from API
 */
async function fetchWardBoundaries(): Promise<WardBoundary[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch ward boundaries: ${response.status}`);
  }

  const geojson = await response.json();

  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('Invalid ward boundaries data: missing features array');
  }

  return geojson.features.map((feature: any) => ({
    id: feature.properties.AREA_NAME || feature.properties.WARD_NAME || 'Unknown',
    name: feature.properties.AREA_NAME || feature.properties.WARD_NAME || 'Unknown',
    number: feature.properties.AREA_S_CD || feature.properties.WARD_NUM || 0,
    geometry: feature.geometry,
    properties: feature.properties,
  }));
}

/**
 * Get ward boundaries data with circuit breaker and hydration
 */
export async function getWardBoundaries(): Promise<WardBoundary[]> {
  return breaker.execute(async () => {
    return getHydratedData('ward-boundaries', fetchWardBoundaries);
  });
}

/**
 * Reset the circuit breaker
 */
export function resetWardBoundariesBreaker(): void {
  breaker.reset();
}