/**
 * Green P Parking service — fetches 2019 snapshot data via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { GreenPParkingLot, GreenPParkingSummary } from '@/config/green-p-parking';
import { summarizeGreenPParking } from '@/config/green-p-parking';

const PARKING_API_URL = '/api/green-p-parking';

const breaker = createCircuitBreaker<GreenPParkingLot[]>({
  name: 'GreenPParking',
  cacheTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days — data is frozen, cache aggressively
  persistCache: true,
});

const emptyFallback: GreenPParkingLot[] = [];

/**
 * Fetch Green P Parking lots (2019 snapshot)
 */
export async function fetchGreenPParking(): Promise<GreenPParkingLot[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('green-p-parking') as GreenPParkingLot[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${PARKING_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Green P Parking API error: ${res.status}`);
      }
      const json: { lots: GreenPParkingLot[]; total: number; lastUpdated: string } = await res.json();
      return json.lots || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Green P Parking data:', error);
    return emptyFallback;
  }
}

/**
 * Get summary statistics
 */
export function getGreenPParkingSummary(lots: GreenPParkingLot[]): GreenPParkingSummary {
  return summarizeGreenPParking(lots);
}