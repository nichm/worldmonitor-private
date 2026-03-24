/**
 * Court & Judicial Facility Locations Service
 */

import { toApiUrl } from '@/services/runtime';
import { createCircuitBreaker } from '@/services/bootstrap';
import { getHydratedData } from '@/services/bootstrap';
import type { CourtFacility } from '@/config/court-facilities';

const FACILITIES_CB = createCircuitBreaker('court-facilities', {
  timeoutMs: 10000,
  halfOpenMaxCalls: 3,
  failureThreshold: 3,
  cooldownMs: 5 * 60 * 1000,
});

export async function fetchCourtFacilities(options: { signal?: AbortSignal } = {}): Promise<CourtFacility[]> {
  try {
    const data = await getHydratedData(
      toApiUrl('/api/court-facilities'),
      FACILITIES_CB,
      { signal: options.signal }
    );

    if (!data || !Array.isArray(data)) {
      console.warn('[Court Facilities] Invalid data format');
      return [];
    }

    return data as CourtFacility[];
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      throw error;
    }
    console.error('[Court Facilities] Fetch failed:', error);
    return [];
  }
}