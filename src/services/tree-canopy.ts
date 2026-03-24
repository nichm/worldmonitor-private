/**
 * Tree Canopy service — fetches urban forest canopy data via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { TreeCanopyArea, TreeCanopySummary } from '@/config/tree-canopy';
import { summarizeTreeCanopy } from '@/config/tree-canopy';

const TREE_CANOPY_API_URL = '/api/tree-canopy';

const breaker = createCircuitBreaker<TreeCanopyArea[]>({
  name: 'TreeCanopy',
  cacheTtlMs: 90 * 24 * 60 * 60 * 1000, // 90 days
  persistCache: true,
});

const emptyFallback: TreeCanopyArea[] = [];

/**
 * Fetch tree canopy areas
 */
export async function fetchTreeCanopy(): Promise<TreeCanopyArea[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('tree-canopy') as TreeCanopyArea[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const url = `${getRpcBaseUrl()}${TREE_CANOPY_API_URL}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Tree Canopy API error: ${res.status}`);
      }
      const json: { areas: TreeCanopyArea[]; total: number; lastUpdated: string } = await res.json();
      return json.areas || [];
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Tree Canopy data:', error);
    return emptyFallback;
  }
}

/**
 * Get summary statistics
 */
export function getTreeCanopySummary(areas: TreeCanopyArea[]): TreeCanopySummary {
  return summarizeTreeCanopy(areas);
}