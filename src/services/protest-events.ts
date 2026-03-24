/**
 * Protest Events service — fetches protest event locations via API
 */
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { ProtestEvent, ProtestEventsData } from '@/config/protest-events';

const API_URL = '/api/protest-events';

const breaker = createCircuitBreaker<ProtestEventsData>({
  name: 'TorontoProtestEvents',
  cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  persistCache: true,
});

const emptyFallback: ProtestEventsData = {
  events: [],
  total: 0,
  lastUpdated: new Date().toISOString(),
  dataSource: 'fallback',
};

/**
 * Fetch protest events
 */
export async function fetchProtestEvents(): Promise<ProtestEventsData> {
  // Try hydrated data first
  const hydrated = getHydratedData('protest-events') as ProtestEventsData | undefined;
  if (hydrated && hydrated.events && hydrated.events.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const res = await fetch(API_URL, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        throw new Error(`Protest Events API error: ${res.status}`);
      }
      const data = await res.json();

      return {
        events: data.events || [],
        total: data.total || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        dataSource: data.dataSource || 'api',
      };
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Protest Events data:', error);
    return emptyFallback;
  }
}

// Re-export from config for backward compatibility
export {
  getProtestEventTypeColor,
  getProtestEventRadius,
  getProtestEventTypeLabel,
  getCrowdSizeLabel,
} from '@/config/protest-events';