/**
 * Toronto Hydro Power Outages
 * Source: Seed data (Toronto Hydro has no public API)
 */

export interface TorontoHydroOutage {
  id: string;
  area: string;
  affected: number;
  cause: string;
  status: string;
  latitude: number;
  longitude: number;
  reportedAt: string;
  estimatedRestoration: string;
}

export interface TorontoHydroSummary {
  total: number;
  active: number;
  totalAffected: number;
  byCause: Record<string, number>;
  byArea: Record<string, number>;
}

export const TORONTO_HYDRO_API_URL = '/api/toronto-hydro';

export let torontoHydroOutages: TorontoHydroOutage[] = [];

export function resetTorontoHydroBreaker(): void {}

export function getTorontoHydroSummary(outages: TorontoHydroOutage[]): TorontoHydroSummary {
  const summary: TorontoHydroSummary = {
    total: outages.length,
    active: 0,
    totalAffected: 0,
    byCause: {},
    byArea: {},
  };

  for (const outage of outages) {
    if (outage.status === 'Active') summary.active++;
    summary.totalAffected += outage.affected || 0;
    summary.byCause[outage.cause] = (summary.byCause[outage.cause] || 0) + 1;
    summary.byArea[outage.area] = (summary.byArea[outage.area] || 0) + 1;
  }

  return summary;
}
