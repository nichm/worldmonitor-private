/**
 * Service: Toronto Hydro Power Outages
 * Manages power outage data
 */

import { createCircuitBreaker } from '@/utils/circuit-breaker';
import { getHydratedData } from '@/utils/hydration';
import type { TorontoHydroOutage } from '@/config/toronto-hydro-outages';

const API_URL = '/api/toronto-hydro-outages';

/**
 * Circuit breaker for Toronto Hydro outages API calls
 */
const breaker = createCircuitBreaker({
  failureThreshold: 3,
  timeout: 10000,
  resetTimeout: 60000,
});

/**
 * Fetch Toronto Hydro outages from API
 */
async function fetchTorontoHydroOutages(): Promise<TorontoHydroOutage[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch Toronto Hydro outages: ${response.status}`);
  }

  const geojson = await response.json();

  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('Invalid Toronto Hydro outages data: missing features array');
  }

  return geojson.features.map((feature: any) => ({
    id: feature.properties.id,
    severity: feature.properties.severity,
    affected_customers: feature.properties.affected_customers,
    status: feature.properties.status,
    estimated_restoration: feature.properties.estimated_restoration,
    cause: feature.properties.cause,
    geometry: feature.geometry,
  }));
}

/**
 * Get Toronto Hydro outages data with circuit breaker and hydration
 */
export async function getTorontoHydroOutages(): Promise<TorontoHydroOutage[]> {
  return breaker.execute(async () => {
    return getHydratedData('toronto-hydro-outages', fetchTorontoHydroOutages);
  });
}

/**
 * Reset the circuit breaker
 */
export function resetTorontoHydroOutagesBreaker(): void {
  breaker.reset();
}