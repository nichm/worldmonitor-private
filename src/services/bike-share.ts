/**
 * Bike Share service — fetches GBFS station data via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { BikeShareStation, BikeShareSummary } from '@/config/bike-share';
import { summarizeBikeShare } from '@/config/bike-share';

const BIKE_SHARE_API_URL = '/api/bike-share';

const breaker = createCircuitBreaker<BikeShareStation[]>({
  name: 'BikeShare',
  cacheTtlMs: 2 * 60 * 1000, // 2 minutes
  persistCache: true,
});

const emptyFallback: BikeShareStation[] = [];

/**
 * Fetch bike share stations
 */
export async function fetchBikeShare(): Promise<BikeShareStation[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('bike-share') as BikeShareStation[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${BIKE_SHARE_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Bike Share API error: ${res.status}`);
      }
      const json: { stations: BikeShareStation[]; total: number; lastUpdated: string } = await res.json();
      return json.stations || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Bike Share data:', error);
    return emptyFallback;
  }
}

/**
 * Get summary statistics
 */
export function getBikeShareSummary(stations: BikeShareStation[]): BikeShareSummary {
  return summarizeBikeShare(stations);
}