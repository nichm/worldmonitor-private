import { toApiUrl } from '@/services/runtime';

export interface SectorOccupancy {
  sector: string;
  occupied: number;
  capacity: number;
  occupancy: number;
}

export interface ShelterGaugeData {
  fetchedAt: string;
  asOf: string;
  citywide: {
    occupied: number;
    capacity: number;
    occupancy: number;
  };
  sectors: SectorOccupancy[];
}

let cachedData: ShelterGaugeData | null = null;
let cachedAt = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes client-side cache

export async function fetchTorontoShelter(): Promise<ShelterGaugeData | null> {
  const now = Date.now();
  if (cachedData && now - cachedAt < CACHE_TTL) return cachedData;

  try {
    const resp = await fetch(toApiUrl('/api/toronto-shelter'), {
      signal: AbortSignal.timeout(20_000),
    });
    if (!resp.ok) return cachedData;

    const raw = await resp.json() as ShelterGaugeData;

    cachedData = raw;
    cachedAt = now;
    return cachedData;
  } catch {
    return cachedData;
  }
}

export function getOccupancyColor(occupancy: number): string {
  if (occupancy >= 99) return 'var(--alert-critical)';
  if (occupancy >= 97) return 'var(--alert-high)';
  if (occupancy >= 90) return 'var(--alert-medium)';
  return 'var(--alert-low)';
}

export function getOccupancyLabel(occupancy: number): string {
  if (occupancy >= 99) return 'Critical';
  if (occupancy >= 97) return 'Very High';
  if (occupancy >= 90) return 'High';
  return 'Available';
}

export function shouldBreakNews(data: ShelterGaugeData): boolean {
  // Break news for citywide > 97% or any sector > 99%
  if (data.citywide.occupancy > 97) return true;
  return data.sectors.some(s => s.occupancy > 99);
}

export function formatOccupancyMessage(data: ShelterGaugeData): string {
  const criticalSectors = data.sectors.filter(s => s.occupancy >= 99).map(s => s.sector);
  if (criticalSectors.length > 0) {
    return `Toronto shelters at ${data.citywide.occupancy}% capacity. Critical: ${criticalSectors.join(', ')}`;
  }
  return `Toronto shelters at ${data.citywide.occupancy}% capacity`;
}