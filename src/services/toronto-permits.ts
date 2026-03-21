import { toApiUrl } from '@/services/runtime';

export interface BuildingPermit {
  permitType: string;
  dwellingUnits: number;
  date: string;
  street: string;
  ward: string;
}

export interface BuildingPermitsData {
  fetchedAt: string;
  startDate: string;
  endDate: string;
  totalUnits: number;
  permits: BuildingPermit[];
}

export interface WeeklySummary {
  week: string;
  totalUnits: number;
  permitCount: number;
}

let cachedData: BuildingPermitsData | null = null;
let cachedAt = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes client-side cache

export async function fetchTorontoPermits(): Promise<BuildingPermitsData | null> {
  const now = Date.now();
  if (cachedData && now - cachedAt < CACHE_TTL) return cachedData;

  try {
    const resp = await fetch(toApiUrl('/api/toronto-permits'), {
      signal: AbortSignal.timeout(20_000),
    });
    if (!resp.ok) return cachedData;

    const raw = await resp.json() as BuildingPermitsData;

    cachedData = raw;
    cachedAt = now;
    return cachedData;
  } catch {
    return cachedData;
  }
}

export function getTopPermits(data: BuildingPermitsData, limit: number = 5): BuildingPermit[] {
  return [...data.permits]
    .sort((a, b) => b.dwellingUnits - a.dwellingUnits)
    .slice(0, limit);
}

export function getWeeklyHistory(currentWeek: BuildingPermitsData, previousWeeks: BuildingPermitsData[] = []): WeeklySummary[] {
  const weeks: WeeklySummary[] = [];

  // Add current week
  weeks.push({
    week: 'This Week',
    totalUnits: currentWeek.totalUnits,
    permitCount: currentWeek.permits.length,
  });

  // Add previous weeks (placeholder data for now - would need historical storage)
  // In a real implementation, you'd fetch historical data or store it
  const numPreviousWeeks = Math.min(3, previousWeeks.length);
  for (let i = 0; i < numPreviousWeeks; i++) {
    const weekData = previousWeeks[i];
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - (i + 1) * 7);
    const weekLabel = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weeks.push({
      week: weekLabel,
      totalUnits: weekData?.totalUnits ?? 0,
      permitCount: weekData?.permits?.length ?? 0,
    });
  }

  // Fill remaining weeks with zeros for the chart
  while (weeks.length < 4) {
    weeks.push({
      week: '-',
      totalUnits: 0,
      permitCount: 0,
    });
  }

  return weeks;
}

export function formatUnitsCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  if (count >= 100) return Math.round(count / 100) * 100 + '';
  return count.toString();
}

export function getPermitImpactLevel(units: number): 'high' | 'medium' | 'low' {
  if (units >= 100) return 'high';
  if (units >= 50) return 'medium';
  return 'low';
}