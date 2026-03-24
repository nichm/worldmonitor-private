/**
 * Ontario Wildfire & Fire Risk Zones Service
 */

import { toApiUrl } from '@/services/runtime';
import { createCircuitBreaker } from '@/services/bootstrap';
import { getHydratedData } from '@/services/bootstrap';
import type { WildfireIncident, FireRiskZone } from '@/config/ontario-wildfires';

const WILDFIRES_CB = createCircuitBreaker('ontario-wildfires', {
  timeoutMs: 10000,
  halfOpenMaxCalls: 3,
  failureThreshold: 3,
  cooldownMs: 10 * 60 * 1000,
});

export async function fetchOntarioWildfires(options: { signal?: AbortSignal } = {}): Promise<{
  wildfires: WildfireIncident[];
  riskZones: FireRiskZone[];
}> {
  try {
    const data = await getHydratedData(
      toApiUrl('/api/ontario-wildfires'),
      WILDFIRES_CB,
      { signal: options.signal }
    );

    if (!data) {
      console.warn('[Ontario Wildfires] Invalid data format');
      return { wildfires: [], riskZones: [] };
    }

    return {
      wildfires: data.wildfires || [],
      riskZones: data.riskZones || [],
    };
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      throw error;
    }
    console.error('[Ontario Wildfires] Fetch failed:', error);
    return { wildfires: [], riskZones: [] };
  }
}