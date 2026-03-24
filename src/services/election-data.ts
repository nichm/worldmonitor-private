/**
 * Election Data service — fetches polling stations and electoral boundaries via API
 */
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { ElectionDataResponse } from '@/config/election-data';

const API_URL = '/api/election-data';

const breaker = createCircuitBreaker<ElectionDataResponse>({
  name: 'ElectionData',
  cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  persistCache: true,
});

const emptyFallback: ElectionDataResponse = {
  pollingStations: [],
  electoralBoundaries: { type: 'FeatureCollection', features: [] },
  metadata: { totalStations: 0, lastUpdated: new Date().toISOString() },
};

/**
 * Fetch election data
 */
export async function fetchElectionData(): Promise<ElectionDataResponse> {
  // Try hydrated data first
  const hydrated = getHydratedData('election-data') as ElectionDataResponse | undefined;
  if (hydrated && hydrated.pollingStations && hydrated.pollingStations.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const res = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Election Data API error: ${res.status}`);
      }
      const data = await res.json();

      if (!data.pollingStations || !Array.isArray(data.pollingStations)) {
        throw new Error('Invalid election data structure: missing pollingStations array');
      }

      if (!data.electoralBoundaries || !data.electoralBoundaries.features) {
        throw new Error('Invalid election data structure: missing electoralBoundaries');
      }

      return {
        pollingStations: data.pollingStations,
        electoralBoundaries: data.electoralBoundaries,
        metadata: data.metadata || {
          totalStations: data.pollingStations.length,
          lastUpdated: new Date().toISOString(),
        },
      };
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Election Data:', error);
    return emptyFallback;
  }
}