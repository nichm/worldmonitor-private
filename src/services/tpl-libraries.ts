/**
 * TPL Libraries service — fetches library branches via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { LibraryBranch, LibraryBranchData } from '@/config/tpl-libraries';
import { summarizeLibraryBranchData } from '@/config/tpl-libraries';

const TPL_LIBRARIES_API_URL = '/api/tpl-libraries';

const breaker = createCircuitBreaker<LibraryBranch[]>({
  name: 'LibraryBranches',
  cacheTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  persistCache: true,
});

const emptyFallback: LibraryBranch[] = [];

/**
 * Fetch library branches
 */
export async function fetchLibraryBranches(): Promise<LibraryBranchData> {
  // Try hydrated data first
  const hydrated = getHydratedData('tpl-libraries') as LibraryBranch[] | undefined;
  if (hydrated && hydrated.length > 0) {
    return summarizeLibraryBranchData(hydrated);
  }

  try {
    const branches = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${TPL_LIBRARIES_API_URL}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000), // 15s timeout
      });
      if (!res.ok) {
        throw new Error(`TPL Libraries API error: ${res.status}`);
      }
      const json = await res.json();
      return json.branches || json || [];
    }, emptyFallback);

    return summarizeLibraryBranchData(branches);
  } catch (error) {
    console.error('Failed to fetch TPL Libraries data:', error);
    return {
      branches: [],
      total: 0,
      byBranchType: {},
    };
  }
}