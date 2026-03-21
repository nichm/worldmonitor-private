import { toApiUrl } from '@/services/runtime';
import { createCircuitBreaker } from '@/utils';

export interface TtcDelayMetrics {
  total_incidents: number;
  avg_delay_minutes: number | null;
  p50_delay_minutes: number | null;
  p95_delay_minutes: number | null;
  max_delay_minutes: number | null;
  health_color: 'green' | 'amber' | 'red';
}

export interface TtcHealthSummary {
  bus: TtcDelayMetrics;
  streetcar: TtcDelayMetrics;
  subway: TtcDelayMetrics;
}

export interface TtcSystemHealth {
  overall_color: 'green' | 'amber' | 'red';
  total_incidents: number;
  weighted_avg_delay: number | null;
}

export interface TtcHealthResponse {
  summary: TtcHealthSummary;
  health_score: TtcSystemHealth;
  period_days: number;
  fetched_at: string;
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Circuit breaker with cache
const breaker = createCircuitBreaker<TtcHealthResponse>({
  name: 'TTCSHealth',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

/**
 * Fetches TTC system health data
 */
export async function fetchTtcHealth(): Promise<TtcHealthResponse> {
  try {
    const response = await breaker.execute(async () => {
      const url = toApiUrl('/api/ttc-health');
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(20000), // 20 second timeout
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.json();
    }, {
      summary: {
        bus: {
          total_incidents: 0,
          avg_delay_minutes: null,
          p50_delay_minutes: null,
          p95_delay_minutes: null,
          max_delay_minutes: null,
          health_color: 'green',
        },
        streetcar: {
          total_incidents: 0,
          avg_delay_minutes: null,
          p50_delay_minutes: null,
          p95_delay_minutes: null,
          max_delay_minutes: null,
          health_color: 'green',
        },
        subway: {
          total_incidents: 0,
          avg_delay_minutes: null,
          p50_delay_minutes: null,
          p95_delay_minutes: null,
          max_delay_minutes: null,
          health_color: 'green',
        },
      },
      health_score: {
        overall_color: 'green',
        total_incidents: 0,
        weighted_avg_delay: null,
      },
      period_days: 30,
      fetched_at: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error('[TTC Health] Fetch failed:', error);
    return {
      summary: {
        bus: {
          total_incidents: 0,
          avg_delay_minutes: null,
          p50_delay_minutes: null,
          p95_delay_minutes: null,
          max_delay_minutes: null,
          health_color: 'green',
        },
        streetcar: {
          total_incidents: 0,
          avg_delay_minutes: null,
          p50_delay_minutes: null,
          p95_delay_minutes: null,
          max_delay_minutes: null,
          health_color: 'green',
        },
        subway: {
          total_incidents: 0,
          avg_delay_minutes: null,
          p50_delay_minutes: null,
          p95_delay_minutes: null,
          max_delay_minutes: null,
          health_color: 'green',
        },
      },
      health_score: {
        overall_color: 'green',
        total_incidents: 0,
        weighted_avg_delay: null,
      },
      period_days: 30,
      fetched_at: new Date().toISOString(),
    };
  }
}

/**
 * Get color hex code for health status
 */
export function getHealthColor(color: 'green' | 'amber' | 'red'): string {
  switch (color) {
    case 'green': return '#4caf50';
    case 'amber': return '#ff9800';
    case 'red': return '#f44336';
  }
}

/**
 * Calculate health percentage score (0-100)
 * Green = 100%, Amber = 50%, Red = 0%
 */
export function getHealthPercentage(color: 'green' | 'amber' | 'red'): number {
  switch (color) {
    case 'green': return 100;
    case 'amber': return 50;
    case 'red': return 0;
  }
}