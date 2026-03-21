import { toApiUrl } from '@/services/runtime';
import { createCircuitBreaker } from '@/utils';

export interface Toronto311Request {
  type: string;
  ward: string;
  status: string;
  lat: number;
  lon: number;
  created_date: string;
}

export interface Toronto311WardStats {
  ward: string;
  total_requests: number;
  open_requests: number;
  by_type: Record<string, number>;
  with_location: number;
  avg_response_time_hours: string | null;
  stress_score: number;
  stress_level: 'low' | 'medium' | 'high';
}

export interface Toronto311CityStats {
  total_requests: number;
  open_requests: number;
  period_days: number;
}

export interface Toronto311Response {
  city_stats: Toronto311CityStats;
  ward_stress_scores: Toronto311WardStats[];
  top_wards: Toronto311WardStats[];
  records: Toronto311Request[];
  fetched_at: string;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Circuit breaker with cache
const breaker = createCircuitBreaker<Toronto311Response>({
  name: 'Toronto311',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

/**
 * Fetches 311 service request data for Toronto
 */
export async function fetchToronto311(): Promise<Toronto311Response> {
  try {
    const response = await breaker.execute(async () => {
      const url = toApiUrl('/api/toronto-311');
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(20000), // 20 second timeout
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.json();
    }, {
      city_stats: { total_requests: 0, open_requests: 0, period_days: 7 },
      ward_stress_scores: [],
      top_wards: [],
      records: [],
      fetched_at: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error('[Toronto 311] Fetch failed:', error);
    return {
      city_stats: { total_requests: 0, open_requests: 0, period_days: 7 },
      ward_stress_scores: [],
      top_wards: [],
      records: [],
      fetched_at: new Date().toISOString(),
    };
  }
}

/**
 * Get records formatted for map layer
 */
export function get311MapLayerRecords(response: Toronto311Response): Array<{
  lat: number;
  lon: number;
  ward: string;
  type: string;
}> {
  return response.records.map(r => ({
    lat: r.lat,
    lon: r.lon,
    ward: r.ward,
    type: r.type,
  }));
}

/**
 * Get highest stress ward
 */
export function getHighestStressWard(response: Toronto311Response): Toronto311WardStats | null {
  return response.ward_stress_scores.length > 0
    ? response.ward_stress_scores[0] ?? null
    : null;
}