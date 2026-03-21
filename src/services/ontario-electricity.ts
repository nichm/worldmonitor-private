import { createCircuitBreaker } from '@/utils';
import { toApiUrl } from '@/services/runtime';
import { dispatchAlert } from '@/services/breaking-news-alerts';
import type { BreakingAlert } from '@/services/breaking-news-alerts';

export type ElectricitySignal = 'surplus' | 'normal' | 'elevated' | 'high' | 'crisis';

export interface ElectricityPrice {
  current: number;
  unit: string;
  timestamp: string | null;
  signal: ElectricitySignal;
}

export interface ElectricityDemand {
  total: number;
  unit: string;
  timestamp: string | null;
}

export interface ElectricitySignals {
  surplus: boolean;
  normal: boolean;
  elevated: boolean;
  high: boolean;
  crisis: boolean;
}

export interface OntarioElectricityData {
  price: ElectricityPrice;
  demand: ElectricityDemand;
  signals: ElectricitySignals;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Circuit breaker with cache
const breaker = createCircuitBreaker<OntarioElectricityData>({
  name: 'OntarioElectricity',
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
 * Dispatches breaking news for high electricity prices
 */
function dispatchElectricityAlerts(data: OntarioElectricityData): void {
  if (!data.price || !data.signals) return;

  cleanupDispatchedEntries();

  // Alert for price > $150/MWh
  if (data.price.current > 150 && data.signals.high) {
    const alertId = `ontario-electricity-high-${Math.floor(Date.now() / (5 * 60 * 1000))}`;

    if (dispatchedAlerts.has(alertId)) {
      return;
    }

    dispatchedAlerts.add(alertId);

    const threatLevel = data.price.current > 300 ? 'critical' : 'high';

    const alert: BreakingAlert = {
      id: alertId,
      headline: `Ontario electricity at $${data.price.current.toFixed(2)}/MWh`,
      source: 'IESO',
      link: 'https://www.ieso.ca/',
      threatLevel,
      timestamp: new Date(),
      origin: 'keyword_spike',
    };

    dispatchAlert(alert);
  }
}

/**
 * Fetches Ontario electricity price and demand from IESO
 */
export async function fetchOntarioElectricityData(): Promise<OntarioElectricityData> {
  const response = await breaker.execute(async () => {
    const url = toApiUrl('/api/ontario-electricity');
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    return await resp.json();
  }, {
    price: { current: 0, unit: '$/MWh', timestamp: null, signal: 'normal' },
    demand: { total: 0, unit: 'MW', timestamp: null },
    signals: { surplus: false, normal: true, elevated: false, high: false, crisis: false }
  });

  // Dispatch alerts for high prices
  dispatchElectricityAlerts(response);

  return response;
}

/**
 * Gets formatted price string for ticker display
 */
export async function getFormattedPrice(): Promise<string> {
  const data = await fetchOntarioElectricityData();
  const { current, signal } = data.price;

  // Add emoji based on signal
  let emoji = '';
  switch (signal) {
    case 'surplus':
      emoji = '📉';
      break;
    case 'normal':
      emoji = '⚡';
      break;
    case 'elevated':
      emoji = '⚠️';
      break;
    case 'high':
      emoji = '🔴';
      break;
    case 'crisis':
      emoji = '🚨';
      break;
  }

  return `${emoji} $${current.toFixed(2)}/MWh`;
}

/**
 * Gets price signal status
 */
export async function getPriceSignal(): Promise<ElectricitySignal> {
  const data = await fetchOntarioElectricityData();
  return data.price.signal;
}

/**
 * Checks if price is in alert range
 */
export async function isPriceAlert(): Promise<boolean> {
  const data = await fetchOntarioElectricityData();
  return data.price.current > 150;
}

/**
 * Gets current demand in MW
 */
export async function getCurrentDemand(): Promise<number> {
  const data = await fetchOntarioElectricityData();
  return data.demand.total;
}

/**
 * Gets signal description
 */
export function getSignalDescription(signal: ElectricitySignal): string {
  switch (signal) {
    case 'surplus':
      return 'Surplus (<$20)';
    case 'normal':
      return 'Normal ($20-80)';
    case 'elevated':
      return 'Elevated ($80-150)';
    case 'high':
      return 'High ($150-300)';
    case 'crisis':
      return 'Crisis (>$300)';
    default:
      return 'Unknown';
  }
}