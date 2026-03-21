import { createCircuitBreaker } from '@/utils';
import { toApiUrl } from '@/services/runtime';
import { dispatchAlert } from '@/services/breaking-news-alerts';
import type { BreakingAlert } from '@/services/breaking-news-alerts';

export interface CrimeCategoryStats {
  category: string;
  currentYtd: number;
  lastYearYtd: number;
  delta: number;
  deltaPct: number;
}

export interface CrimeTotals {
  currentYtd: number;
  lastYearYtd: number;
  delta: number;
  deltaPct: number;
}

export interface TorontoCrimeData {
  categories: CrimeCategoryStats[];
  totals: CrimeTotals | null;
  period: {
    currentYearStart: string;
    currentYearEnd: string;
    lastYearStart: string;
    lastYearEnd: string;
  };
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Circuit breaker with cache
const breaker = createCircuitBreaker<TorontoCrimeData>({
  name: 'TorontoCrime',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// Track already-dispatched alerts to avoid duplicates
const dispatchedAlerts = new Set<string>();
const DISPATCHED_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Cleans up old dispatch tracking entries
 */
function cleanupDispatchedEntries() {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const id of dispatchedAlerts) {
    const timestamp = parseInt(id.split('-')[2] || '0', 10);
    if (now - timestamp > DISPATCHED_TTL_MS) {
      toDelete.push(id);
    }
  }

  for (const id of toDelete) {
    dispatchedAlerts.delete(id);
  }
}

/**
 * Dispatches breaking news for high crime deltas
 */
function dispatchCrimeAlerts(data: TorontoCrimeData): void {
  if (!data.categories) return;

  cleanupDispatchedEntries();

  // Check Auto Theft category for >20% increase
  const autoTheft = data.categories.find(cat =>
    cat.category.toLowerCase().includes('auto')
  );

  if (autoTheft && autoTheft.deltaPct > 20) {
    const alertId = `toronto-crime-auto-theft-${Date.now()}`;

    if (dispatchedAlerts.has(alertId)) {
      return;
    }

    dispatchedAlerts.add(alertId);

    const alert: BreakingAlert = {
      id: alertId,
      headline: `Auto Theft YTD Up ${autoTheft.deltaPct}%`,
      source: 'Toronto Police Service',
      link: 'https://www.torontopolice.on.ca/statistics/',
      threatLevel: 'high',
      timestamp: new Date(),
      origin: 'keyword_spike',
    };

    dispatchAlert(alert);
  }
}

/**
 * Fetches Toronto Police crime statistics
 */
export async function fetchTorontoCrimeStats(): Promise<TorontoCrimeData> {
  const response = await breaker.execute(async () => {
    const url = toApiUrl('/api/toronto-crime');
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    return await resp.json();
  }, { categories: [], totals: null, period: { currentYearStart: '', currentYearEnd: '', lastYearStart: '', lastYearEnd: '' } });

  // Dispatch alerts for high crime deltas
  dispatchCrimeAlerts(response);

  return response;
}

/**
 * Gets crime stats for a specific category
 */
export async function getCrimeCategoryStats(category: string): Promise<CrimeCategoryStats | null> {
  const data = await fetchTorontoCrimeStats();
  return data.categories.find(cat =>
    cat.category.toLowerCase() === category.toLowerCase()
  ) || null;
}

/**
 * Gets total crime delta
 */
export async function getTotalCrimeDelta(): Promise<{ delta: number; deltaPct: number }> {
  const data = await fetchTorontoCrimeStats();
  return {
    delta: data.totals?.delta || 0,
    deltaPct: data.totals?.deltaPct || 0,
  };
}