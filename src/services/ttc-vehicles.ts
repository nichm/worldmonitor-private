/**
 * TTC Vehicles service — fetches real-time transit vehicle positions
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { TTCVehicle } from '@/config/ttc-vehicles';

const TTC_VEHICLES_API_URL = '/api/ttc-vehicles';

const breaker = createCircuitBreaker<TTCVehicle[]>({
  name: 'TTCVehicles',
  cacheTtlMs: 60 * 1000, // 60 seconds
  persistCache: false, // Real-time data, don't persist
});

const emptyFallback: TTCVehicle[] = [];

/**
 * Fetch TTC vehicle positions
 */
export async function fetchTTCVehicles(): Promise<TTCVehicle[]> {
  // Try hydrated data first (for static snapshots)
  const hydrated = getHydratedData('ttc-vehicles') as TTCVehicle[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${TTC_VEHICLES_API_URL}`;
      const res = await fetch(url, {
        cache: 'no-cache',
      });
      if (!res.ok) {
        throw new Error(`TTC Vehicles API error: ${res.status}`);
      }
      const json: { vehicles: TTCVehicle[] } = await res.json();
      return json.vehicles || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch TTC Vehicles data:', error);
    return emptyFallback;
  }
}