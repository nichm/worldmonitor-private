import { createCircuitBreaker } from '@/utils';
import { toApiUrl } from '@/services/runtime';

export type DevelopmentCategory = 'site_plan' | 'rezoning' | 'opa' | 'other';

export interface DevelopmentApplication {
  application_number: string;
  application_date: string;
  application_type: string;
  application_status: string;
  status_current: string;
  description: string | null;
  property_address: string;
  postal_code: string;
  lat: number;
  lon: number;
  ward_name: string;
  city: string;
  category: DevelopmentCategory;
}

export interface DevelopmentCategoryCounts {
  site_plan: number;
  rezoning: number;
  opa: number;
  other: number;
}

export interface TorontoDevelopmentData {
  applications: DevelopmentApplication[];
  categoryCounts: DevelopmentCategoryCounts;
  total: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Circuit breaker with cache
const breaker = createCircuitBreaker<TorontoDevelopmentData>({
  name: 'TorontoDevelopment',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

/**
 * Fetches GTA development applications from Toronto Open Data
 */
export async function fetchTorontoDevelopmentData(): Promise<TorontoDevelopmentData> {
  const response = await breaker.execute(async () => {
    const url = toApiUrl('/api/toronto-development');
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    return await resp.json();
  }, { applications: [], categoryCounts: { site_plan: 0, rezoning: 0, opa: 0, other: 0 }, total: 0 });

  return response;
}

/**
 * Gets applications by category
 */
export async function getApplicationsByCategory(category: DevelopmentCategory): Promise<DevelopmentApplication[]> {
  const data = await fetchTorontoDevelopmentData();
  return data.applications.filter(app => app.category === category);
}

/**
 * Gets applications by ward
 */
export async function getApplicationsByWard(wardName: string): Promise<DevelopmentApplication[]> {
  const data = await fetchTorontoDevelopmentData();
  return data.applications.filter(app =>
    app.ward_name.toLowerCase() === wardName.toLowerCase()
  );
}

/**
 * Gets active development count by category
 */
export async function getActiveDevelopmentCounts(): Promise<DevelopmentCategoryCounts> {
  const data = await fetchTorontoDevelopmentData();
  return data.categoryCounts;
}

/**
 * Converts applications to map layer format (for visualization)
 */
export function applicationsToMapLayer(applications: DevelopmentApplication[]): DevelopmentApplication[] {
  return applications.filter(app => app.lat !== null && app.lon !== null);
}

/**
 * Gets color for a development category
 */
export function getCategoryColor(category: DevelopmentCategory): string {
  switch (category) {
    case 'site_plan':
      return '#10b981'; // Green: Imminent
    case 'rezoning':
      return '#f59e0b'; // Yellow: Pipeline
    case 'opa':
      return '#3b82f6'; // Blue: Long-term
    default:
      return '#6b7280'; // Gray: Other
  }
}

/**
 * Gets label for a development category
 */
export function getCategoryLabel(category: DevelopmentCategory): string {
  switch (category) {
    case 'site_plan':
      return 'Site Plan (Imminent)';
    case 'rezoning':
      return 'Rezoning (Pipeline)';
    case 'opa':
      return 'OPA (Long-term)';
    default:
      return 'Other';
  }
}