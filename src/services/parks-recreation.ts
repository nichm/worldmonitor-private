/**
 * Parks & Recreation service — fetches GeoJSON + merges live centres.json status
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { ParksRecreationFacility, ParksRecreationResponse } from '@/config/parks-recreation';

const PARKS_API_URL = '/api/parks-recreation';

const breaker = createCircuitBreaker<ParksRecreationFacility[]>({
  name: 'ParksRecreation',
  cacheTtlMs: 15 * 60 * 1000,
  persistCache: true,
});

const emptyFallback: ParksRecreationFacility[] = [];

/**
 * Fetch parks & recreation facilities (static GeoJSON merged with live status)
 */
export async function fetchParksRecreation(): Promise<ParksRecreationFacility[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('parks-recreation') as ParksRecreationFacility[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${PARKS_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Parks & Recreation API error: ${res.status}`);
      }
      const json: ParksRecreationResponse = await res.json();
      return json.facilities || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Parks & Recreation data:', error);
    return emptyFallback;
  }
}

/**
 * Count facilities by amenity type
 */
export function countByAmenity(
  facilities: ParksRecreationFacility[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of facilities) {
    const type = f.amenityType || 'other';
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

/**
 * Count facilities by live status
 */
export function countByLiveStatus(
  facilities: ParksRecreationFacility[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of facilities) {
    const status = f.liveStatus || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
}
