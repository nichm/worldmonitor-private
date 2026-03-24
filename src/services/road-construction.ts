/**
 * Road Construction & Closures Service
 */

import { toApiUrl } from '@/services/runtime';
import { createCircuitBreaker } from '@/services/bootstrap';
import { getHydratedData } from '@/services/bootstrap';
import type { RoadConstructionEvent } from '@/config/road-construction';

const CONSTRUCTION_CB = createCircuitBreaker('road-construction', {
  timeoutMs: 15000,
  halfOpenMaxCalls: 3,
  failureThreshold: 3,
  cooldownMs: 5 * 60 * 1000,
});

export async function fetchRoadConstruction(options: { signal?: AbortSignal } = {}): Promise<RoadConstructionEvent[]> {
  try {
    const data = await getHydratedData(
      toApiUrl('/api/road-construction'),
      CONSTRUCTION_CB,
      { signal: options.signal }
    );

    if (!data || !Array.isArray(data)) {
      console.warn('[Road Construction] Invalid data format');
      return [];
    }

    return data as RoadConstructionEvent[];
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      throw error;
    }
    console.error('[Road Construction] Fetch failed:', error);
    return [];
  }
}