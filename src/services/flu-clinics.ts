/**
 * Flu Clinics service — fetches flu clinic locations via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { FluClinic, FluClinicData } from '@/config/flu-clinics';
import { summarizeFluClinicData, isFluSeason } from '@/config/flu-clinics';

const FLU_CLINICS_API_URL = '/api/flu-clinics';

const breaker = createCircuitBreaker<FluClinic[]>({
  name: 'FluClinics',
  cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  persistCache: true,
});

const emptyFallback: FluClinic[] = [];

/**
 * Fetch flu clinics
 */
export async function fetchFluClinics(): Promise<FluClinicData> {
  // Don't fetch outside flu season
  if (!isFluSeason()) {
    return {
      clinics: [],
      total: 0,
      byType: {},
    };
  }

  // Try hydrated data first
  const hydrated = getHydratedData('flu-clinics') as FluClinic[] | undefined;
  if (hydrated && hydrated.length > 0) {
    return summarizeFluClinicData(hydrated);
  }

  try {
    const clinics = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${FLU_CLINICS_API_URL}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
      if (!res.ok) {
        throw new Error(`Flu Clinics API error: ${res.status}`);
      }
      const json = await res.json();
      return json.clinics || json || [];
    }, emptyFallback);

    return summarizeFluClinicData(clinics);
  } catch (error) {
    console.error('Failed to fetch Flu Clinics data:', error);
    return {
      clinics: [],
      total: 0,
      byType: {},
    };
  }
}