/**
 * TTC Real-Time Vehicle Positions Service
 */

import { toApiUrl } from '@/services/runtime';
import { createCircuitBreaker } from '@/services/bootstrap';
import { getHydratedData } from '@/services/bootstrap';
import type { TtcVehicle } from '@/config/ttc-realtime';

const VEHICLES_CB = createCircuitBreaker('ttc-realtime', {
  timeoutMs: 10000,
  halfOpenMaxCalls: 5,
  failureThreshold: 3,
  cooldownMs: 2 * 60 * 1000, // Shorter cooldown for real-time data
});

export async function fetchTtcVehicles(options: { signal?: AbortSignal } = {}): Promise<TtcVehicle[]> {
  try {
    const data = await getHydratedData(
      toApiUrl('/api/ttc-realtime'),
      VEHICLES_CB,
      { signal: options.signal }
    );

    if (!data || !Array.isArray(data)) {
      console.warn('[TTC Real-Time] Invalid data format');
      return [];
    }

    return data as TtcVehicle[];
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      throw error;
    }
    console.error('[TTC Real-Time] Fetch failed:', error);
    return [];
  }
}