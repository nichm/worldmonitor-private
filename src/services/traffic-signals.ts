/**
 * Service: Traffic Signal Locations
 * Manages Toronto traffic signal data
 */

import { createCircuitBreaker } from '@/utils/circuit-breaker';
import { getHydratedData } from '@/utils/hydration';
import type { TrafficSignal } from '@/config/traffic-signals';

const API_URL = '/api/traffic-signals';

/**
 * Circuit breaker for traffic signals API calls
 */
const breaker = createCircuitBreaker({
  failureThreshold: 3,
  timeout: 15000,
  resetTimeout: 60000,
});

/**
 * Fetch traffic signals from API
 */
async function fetchTrafficSignals(): Promise<TrafficSignal[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch traffic signals: ${response.status}`);
  }

  const geojson = await response.json();

  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('Invalid traffic signals data: missing features array');
  }

  return geojson.features.map((feature: any) => ({
    id: feature.properties.id,
    type: feature.properties.type,
    status: feature.properties.status,
    intersection: feature.properties.intersection,
    geometry: feature.geometry,
  }));
}

/**
 * Get traffic signals data with circuit breaker and hydration
 */
export async function getTrafficSignals(): Promise<TrafficSignal[]> {
  return breaker.execute(async () => {
    return getHydratedData('traffic-signals', fetchTrafficSignals);
  });
}

/**
 * Reset the circuit breaker
 */
export function resetTrafficSignalsBreaker(): void {
  breaker.reset();
}