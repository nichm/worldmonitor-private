import { createCircuitBreaker } from '@/utils';
import { toApiUrl } from '@/services/runtime';
import { dispatchAlert } from '@/services/breaking-news-alerts';

export interface WaterLevelReading {
  timestamp: string;
  value: number | null;
  qc?: string;
  isQualityControlled?: boolean;
}

export interface WaterLevelData {
  fetchedAt: string;
  stationId: string;
  stationName: string;
  currentReading: WaterLevelReading | null;
  predictedReading: WaterLevelReading | null;
  deviation: number | null;
  deviationThreshold: number;
  error?: string;
  message?: string;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Circuit breaker with cache
const breaker = createCircuitBreaker<WaterLevelData>({
  name: 'TorontoWaterLevel',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// Track alerts to avoid duplicates
let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/**
 * Dispatches breaking news for significant surge events
 */
function checkSurgeAlert(data: WaterLevelData): void {
  const now = Date.now();

  // Check cooldown
  if (now - lastAlertTime < ALERT_COOLDOWN_MS) {
    return;
  }

  // Check if deviation exceeds threshold
  if (data.deviation !== null && Math.abs(data.deviation) > data.deviationThreshold) {
    const surgeDirection = data.deviation > 0 ? 'above' : 'below';
    const magnitude = Math.abs(data.deviation).toFixed(2);

    const alert = {
      id: `toronto-water-surge-${now}`,
      headline: `Lake Ontario Water Level ${surgeDirection} Predicted by ${magnitude}m`,
      source: 'DFO Water Level Monitoring',
      link: 'https://www.waterlevels.gc.ca/eng/Stations',
      threatLevel: 'high' as const,
      timestamp: new Date(),
      origin: 'keyword_spike' as const,
    };

    dispatchAlert(alert);
    lastAlertTime = now;
  }
}

/**
 * Fetches Toronto Harbour water level data
 */
export async function fetchTorontoWaterLevel(): Promise<WaterLevelData> {
  const response = await breaker.execute(async () => {
    const url = toApiUrl('/api/toronto-water-level');
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    return await resp.json();
  }, {
    error: 'Service unavailable',
    stationId: '5160-DHO-002',
    stationName: 'Toronto Harbour',
    currentReading: null,
    predictedReading: null,
    deviation: null,
    deviationThreshold: 0.3,
  });

  // Check for surge alerts if data is valid
  if (!response.error && response.deviation !== null) {
    checkSurgeAlert(response);
  }

  return response;
}

/**
 * Gets the status color for water level deviation
 */
export function getDeviationColor(deviation: number | null, threshold: number): number[] {
  if (deviation === null) {
    return [150, 150, 150]; // Grey - no data
  }

  if (Math.abs(deviation) > threshold * 1.5) {
    return [200, 0, 0]; // Red - significant surge
  } else if (Math.abs(deviation) > threshold) {
    return [255, 140, 0]; // Orange - moderate surge
  } else if (Math.abs(deviation) > threshold * 0.5) {
    return [255, 200, 0]; // Yellow - minor deviation
  } else {
    return [0, 150, 200]; // Blue - normal
  }
}

/**
 * Gets the gauge value (0-100) for a water level reading
 * Returns percentage relative to typical range (74-75.5m above sea level)
 */
export function getGaugeValue(value: number | null): number {
  if (value === null) return 0;

  const minLevel = 74.0; // meters
  const maxLevel = 75.5; // meters
  const range = maxLevel - minLevel;

  const normalized = (value - minLevel) / range;
  return Math.max(0, Math.min(100, normalized * 100));
}

/**
 * Formats water level value for display
 */
export function formatWaterLevel(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(2)} m`;
}

/**
 * Formats deviation for display
 */
export function formatDeviation(deviation: number | null): string {
  if (deviation === null) return 'N/A';

  const sign = deviation > 0 ? '+' : '';
  return `${sign}${deviation.toFixed(2)} m`;
}

/**
 * Gets the description for deviation status
 */
export function getDeviationStatus(deviation: number | null, threshold: number): string {
  if (deviation === null) return 'No Data';

  const absDev = Math.abs(deviation);

  if (absDev > threshold * 1.5) {
    return deviation > 0 ? 'High Surge' : 'Low Surge';
  } else if (absDev > threshold) {
    return deviation > 0 ? 'Elevated' : 'Depressed';
  } else if (absDev > threshold * 0.5) {
    return 'Slight Deviation';
  } else {
    return 'Normal';
  }
}