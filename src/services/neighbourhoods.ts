/**
 * Service: Neighbourhood Profiles & Demographics
 * Manages Toronto neighbourhood boundary data
 */

import { createCircuitBreaker } from '@/utils/circuit-breaker';
import { getHydratedData } from '@/utils/hydration';
import type { Neighbourhood } from '@/config/neighbourhoods';

const API_URL = '/api/neighbourhoods';

/**
 * Circuit breaker for neighbourhoods API calls
 */
const breaker = createCircuitBreaker({
  failureThreshold: 3,
  timeout: 15000,
  resetTimeout: 60000,
});

/**
 * Fetch neighbourhood boundaries from API
 */
async function fetchNeighbourhoods(): Promise<Neighbourhood[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch neighbourhoods: ${response.status}`);
  }

  const geojson = await response.json();

  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('Invalid neighbourhoods data: missing features array');
  }

  return geojson.features.map((feature: any) => ({
    id: feature.properties.AREA_NAME || feature.properties.name || 'Unknown',
    name: feature.properties.AREA_NAME || feature.properties.name || 'Unknown',
    geometry: feature.geometry,
    properties: feature.properties,
  }));
}

/**
 * Get neighbourhoods data with circuit breaker and hydration
 */
export async function getNeighbourhoods(): Promise<Neighbourhood[]> {
  return breaker.execute(async () => {
    return getHydratedData('neighbourhoods', fetchNeighbourhoods);
  });
}

/**
 * Reset the circuit breaker
 */
export function resetNeighbourhoodsBreaker(): void {
  breaker.reset();
}