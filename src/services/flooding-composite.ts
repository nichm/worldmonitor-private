/**
 * Flooding Composite Service
 */

import { toApiUrl } from '@/services/runtime';
import { createCircuitBreaker } from '@/services/bootstrap';
import { getHydratedData } from '@/services/bootstrap';
import type { FloodZone, FloodReport, HydrometricStation } from '@/config/flooding-composite';

const FLOODING_CB = createCircuitBreaker('flooding-composite', {
  timeoutMs: 10000,
  halfOpenMaxCalls: 3,
  failureThreshold: 3,
  cooldownMs: 5 * 60 * 1000,
});

export async function fetchFloodingComposite(options: { signal?: AbortSignal } = {}): Promise<{
  floodZones: FloodZone[];
  floodReports: FloodReport[];
  hydrometricStations: HydrometricStation[];
}> {
  try {
    const data = await getHydratedData(
      toApiUrl('/api/flooding-composite'),
      FLOODING_CB,
      { signal: options.signal }
    );

    if (!data) {
      console.warn('[Flooding Composite] Invalid data format');
      return {
        floodZones: [],
        floodReports: [],
        hydrometricStations: [],
      };
    }

    return {
      floodZones: data.floodZones || [],
      floodReports: data.floodReports || [],
      hydrometricStations: data.hydrometricStations || [],
    };
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      throw error;
    }
    console.error('[Flooding Composite] Fetch failed:', error);
    return {
      floodZones: [],
      floodReports: [],
      hydrometricStations: [],
    };
  }
}