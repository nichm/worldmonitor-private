/**
 * Config: Toronto Hydro Power Outages
 * Defines power outage types and styling
 */

export interface TorontoHydroOutage {
  id: string;
  severity: string;
  affected_customers: number;
  status: string;
  estimated_restoration: string;
  cause: string;
  geometry: any;
}

export type TorontoHydroOutageLayerProps = {
  getFillColor: (d: any) => number[];
  getRadius: (d: any) => number;
  pickable: boolean;
  onClick: (info: any) => void;
};

/**
 * Get outage color by severity
 */
export function getOutageColor(severity: string): number[] {
  switch (severity) {
    case 'major':
      return [239, 68, 68, 200]; // Red
    case 'minor':
      return [245, 158, 11, 200]; // Orange
    default:
      return [107, 114, 128, 200]; // Gray
  }
}

/**
 * Get outage radius based on affected customers
 */
export function getOutageRadius(affected_customers: number): number {
  // Scale radius logarithmically for better visualization
  const minRadius = 20;
  const maxRadius = 100;
  const minCustomers = 10;
  const maxCustomers = 5000;

  if (affected_customers <= 0) return minRadius;

  const logMin = Math.log(minCustomers);
  const logMax = Math.log(maxCustomers);
  const logValue = Math.log(Math.min(affected_customers, maxCustomers));

  const normalized = (logValue - logMin) / (logMax - logMin);
  return minRadius + (normalized * (maxRadius - minRadius));
}

/**
 * Default layer props for Toronto Hydro outages
 */
export const DEFAULT_TORONTO_HYDRO_OUTAGES_PROPS: TorontoHydroOutageLayerProps = {
  getFillColor: (d: any) => getOutageColor(d.properties?.severity || 'minor'),
  getRadius: (d: any) => getOutageRadius(d.properties?.affected_customers || 10),
  pickable: true,
  onClick: (info: any) => {
    if (info.object) {
      console.log('Toronto Hydro outage clicked:', info.object.properties);
    }
  },
};

/**
 * Data source URL for Toronto Hydro outages
 */
export const TORONTO_HYDRO_OUTAGES_SOURCE_URL = '/api/toronto-hydro-outages';

/**
 * Refresh interval (in milliseconds)
 */
export const TORONTO_HYDRO_OUTAGES_REFRESH_INTERVAL = 60 * 5 * 1000; // 5 minutes