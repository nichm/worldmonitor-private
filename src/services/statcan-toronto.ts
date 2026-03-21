import { toApiUrl } from '@/services/runtime';
import { createCircuitBreaker } from '@/utils';
import { dispatchAlert } from '@/services/breaking-news-alerts';
import type { BreakingAlert } from '@/services/breaking-news-alerts';

export interface StatCanSparklinePoint {
  period: string;
  value: number;
}

export interface StatCanIndicator {
  vector_id: string;
  name: string;
  latest_value: number | null;
  latest_period: string | null;
  previous_value: number | null;
  previous_period: string | null;
  mom_change: number | null;
  yoy_change: number | null;
  sparkline: StatCanSparklinePoint[];
}

export interface StatCanAlert {
  id: string;
  type: 'cpi_mom_spike' | 'unemployment_change';
  message: string;
  severity: 'critical' | 'high';
  value: number;
  threshold: number;
  period: string | null;
}

export interface StatCanResponse {
  indicators: StatCanIndicator[];
  alerts: StatCanAlert[];
  fetched_at: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Circuit breaker with cache
const breaker = createCircuitBreaker<StatCanResponse>({
  name: 'StatCanToronto',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// Track already-dispatched alerts to avoid duplicates
const dispatchedAlerts = new Set<string>();
const DISPATCHED_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours (since statcan updates monthly)

/**
 * Cleans up old dispatch tracking entries
 */
function cleanupDispatchedEntries() {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const id of dispatchedAlerts) {
    const timestamp = parseInt(id.split('-').pop() || '0', 10);
    if (now - timestamp > DISPATCHED_TTL_MS) {
      toDelete.push(id);
    }
  }

  for (const id of toDelete) {
    dispatchedAlerts.delete(id);
  }
}

/**
 * Dispatches breaking news for StatCan alerts
 */
function dispatchStatCanAlerts(alerts: StatCanAlert[]): void {
  cleanupDispatchedEntries();

  for (const alert of alerts) {
    if (dispatchedAlerts.has(alert.id)) {
      continue;
    }

    dispatchedAlerts.add(alert.id);

    const breakingAlert: BreakingAlert = {
      id: alert.id,
      headline: alert.message,
      source: 'Statistics Canada',
      link: 'https://www150.statcan.gc.ca/n1/en/type/data',
      threatLevel: alert.severity as 'critical' | 'high',
      timestamp: new Date(),
      origin: 'keyword_spike',
    };

    dispatchAlert(breakingAlert);
  }
}

/**
 * Fetches StatCan Toronto economic indicators
 */
export async function fetchStatCanToronto(): Promise<StatCanResponse> {
  try {
    const response = await breaker.execute(async () => {
      const url = toApiUrl('/api/statcan-toronto');
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.json();
    }, { indicators: [], alerts: [], fetched_at: new Date().toISOString() });

    // Dispatch breaking news for any alerts
    if (response.alerts && response.alerts.length > 0) {
      dispatchStatCanAlerts(response.alerts);
    }

    return response;
  } catch (error) {
    console.error('[StatCan Toronto] Fetch failed:', error);
    return {
      indicators: [],
      alerts: [],
      fetched_at: new Date().toISOString(),
    };
  }
}

/**
 * Get a specific indicator by vector ID
 */
export function getIndicatorByVectorId(
  response: StatCanResponse,
  vectorId: string
): StatCanIndicator | undefined {
  return response.indicators.find(i => i.vector_id === vectorId);
}

/**
 * Get latest CPI value and change
 */
export function getCpiIndicator(response: StatCanResponse): StatCanIndicator | undefined {
  return getIndicatorByVectorId(response, 'v41690973');
}

/**
 * Get latest unemployment rate and change
 */
export function getUnemploymentIndicator(response: StatCanResponse): StatCanIndicator | undefined {
  return getIndicatorByVectorId(response, 'v2062815');
}

/**
 * Get latest NHPI value and change
 */
export function getNhpiIndicator(response: StatCanResponse): StatCanIndicator | undefined {
  return getIndicatorByVectorId(response, 'v111955442');
}