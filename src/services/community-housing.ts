/**
 * Community Housing service — fetches Toronto Community Housing buildings via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { CommunityHousingBuilding } from '@/config/community-housing';

const COMMUNITY_HOUSING_API_URL = '/api/community-housing';

const breaker = createCircuitBreaker<CommunityHousingBuilding[]>({
  name: 'CommunityHousing',
  cacheTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  persistCache: true,
});

const emptyFallback: CommunityHousingBuilding[] = [];

/**
 * Fetch community housing buildings
 */
export async function fetchCommunityHousing(): Promise<CommunityHousingBuilding[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('community-housing') as CommunityHousingBuilding[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${COMMUNITY_HOUSING_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Community Housing API error: ${res.status}`);
      }
      const json: CommunityHousingBuilding[] = await res.json();
      return json || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Community Housing data:', error);
    return emptyFallback;
  }
}