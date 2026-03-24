/**
 * AGCO Licences service — fetches liquor licences via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { AGCOLicence, AGCOLicenceData } from '@/config/agco-licences';
import { summarizeAGCOLicenceData } from '@/config/agco-licences';

const AGCO_API_URL = '/api/agco-licences';

const breaker = createCircuitBreaker<AGCOLicence[]>({
  name: 'AGCOLicences',
  cacheTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  persistCache: true,
});

const emptyFallback: AGCOLicence[] = [];

/**
 * Fetch AGCO liquor licences
 */
export async function fetchAGCOLicences(): Promise<AGCOLicenceData> {
  // Try hydrated data first
  const hydrated = getHydratedData('agco-licences') as AGCOLicence[] | undefined;
  if (hydrated && hydrated.length > 0) {
    return summarizeAGCOLicenceData(hydrated);
  }

  try {
    const licences = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${AGCO_API_URL}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
      if (!res.ok) {
        throw new Error(`AGCO API error: ${res.status}`);
      }
      const json = await res.json();
      return json.licences || json || [];
    }, emptyFallback);

    return summarizeAGCOLicenceData(licences);
  } catch (error) {
    console.error('Failed to fetch AGCO Licences data:', error);
    return {
      licences: [],
      total: 0,
      byType: {},
      byWard: {},
    };
  }
}