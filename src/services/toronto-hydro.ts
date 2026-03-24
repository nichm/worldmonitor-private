import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { TorontoHydroOutage } from '@/config/toronto-hydro';

const TORONTO_HYDRO_API_URL = '/api/toronto-hydro';

const breaker = createCircuitBreaker<TorontoHydroOutage[]>({
  timeout: 15000,
  resetTimeout: 60000,
});

export async function fetchTorontoHydro(): Promise<TorontoHydroOutage[]> {
  try {
    const hydrated = await getHydratedData<TorontoHydroOutage[]>('toronto-hydro');
    if (hydrated && hydrated.length > 0) return hydrated;

    const data = await breaker.execute(() =>
      fetch(TORONTO_HYDRO_API_URL).then(r => r.json()).then(j => j.outages || [])
    );
    return data || [];
  } catch {
    return [];
  }
}

export function resetTorontoHydroBreaker(): void {
  breaker.reset();
}
