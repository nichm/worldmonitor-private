import { createCircuitBreaker } from "@/utils";
import { toApiUrl } from "@/services/runtime";
import { dispatchAlert } from "@/services/breaking-news-alerts";

export interface SpillRecord {
  id: string;
  spillDate: string;
  reportedDate: string | null;
  city: string;
  address: string | null;
  material: string;
  quantity: number | null;
  units: string | null;
  hazardClass: string;
  category: string | null;
  severityLevel: "FLASH" | "PRIORITY" | "ROUTINE" | "NONE";
}

export interface SpillResponse {
  fetchedAt: string;
  spills: SpillRecord[];
  total: number;
  flashCount: number;
  priorityCount: number;
  routineCount: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  error?: string;
  message?: string;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Circuit breaker with cache
const breaker = createCircuitBreaker<SpillResponse>({
  name: "OntarioSpills",
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// GTA municipality coordinates for geocoding
const MUNICIPALITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Toronto: { lat: 43.6532, lon: -79.3832 },
  Mississauga: { lat: 43.589, lon: -79.6441 },
  Brampton: { lat: 43.6831, lon: -79.7663 },
  Markham: { lat: 43.8868, lon: -79.3364 },
  Vaughan: { lat: 43.8362, lon: -79.4987 },
  "Richmond Hill": { lat: 43.8791, lon: -79.4378 },
  Oakville: { lat: 43.4675, lon: -79.6877 },
  Burlington: { lat: 43.325, lon: -79.8 },
  Ajax: { lat: 43.8509, lon: -79.0345 },
  Pickering: { lat: 43.8382, lon: -79.0868 },
};

// Track dispatched spill IDs to avoid duplicates
const dispatchedSpills = new Set<string>();
const DISPATCHED_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Cleans up old dispatch tracking entries
 */
function cleanupDispatchedEntries(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const id of dispatchedSpills) {
    // Extract spill date from ID
    const dateMatch = id.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch?.[1]) {
      const spillDate = new Date(dateMatch[1]).getTime();
      if (now - spillDate > DISPATCHED_TTL_MS) {
        toDelete.push(id);
      }
    }
  }

  for (const id of toDelete) {
    dispatchedSpills.delete(id);
  }
}

/**
 * Geocodes a spill address to coordinates
 */
function geocodeSpill(spill: SpillRecord): { lat: number; lon: number } | null {
  const city = spill.city.toLowerCase();

  // First, try direct city match
  for (const [muniName, coords] of Object.entries(MUNICIPALITY_COORDS)) {
    if (city.includes(muniName.toLowerCase())) {
      return coords;
    }
  }

  return null;
}

/**
 * Dispatches breaking news for flash spills
 */
function checkSpillAlerts(spills: SpillRecord[]): void {
  cleanupDispatchedEntries();

  for (const spill of spills) {
    if (spill.severityLevel !== "FLASH") {
      continue;
    }

    if (dispatchedSpills.has(spill.id)) {
      continue;
    }

    dispatchedSpills.add(spill.id);

    const headline = `${spill.hazardClass || "Hazmat"} Spill - ${spill.city} - ${spill.material}`;

    const alert = {
      id: `spill-${spill.id}`,
      headline,
      source: "Ontario Spills Database",
      link: "https://data.ontario.ca/dataset/spills-to-the-natural-environment",
      threatLevel: "critical" as const,
      timestamp: new Date(spill.spillDate),
      origin: "keyword_spike" as const,
    };

    dispatchAlert(alert);
  }
}

/**
 * Fetches Ontario spills data from CKAN Datastore
 */
export async function fetchOntarioSpills(): Promise<SpillResponse> {
  const response = await breaker.execute(
    async () => {
      const url = toApiUrl("/api/ontario-spills");
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.json();
    },
    {
      error: "Service unavailable",
      spills: [],
      total: 0,
      flashCount: 0,
      priorityCount: 0,
      routineCount: 0,
      dateRange: { startDate: "", endDate: "" },
    },
  );

  // Check for alerts if we have valid data
  if (!response.error && response.spills.length > 0) {
    checkSpillAlerts(response.spills);
  }

  return response;
}

/**
 * Gets the color for a spill severity level
 */
export function getSpillSeverityColor(severity: string): number[] {
  switch (severity) {
    case "FLASH":
      return [255, 0, 0]; // Red
    case "PRIORITY":
      return [255, 140, 0]; // Orange
    case "ROUTINE":
      return [255, 200, 0]; // Yellow
    default:
      return [150, 150, 150]; // Grey
  }
}

/**
 * Converts spills to map layer format
 */
export function spillsToMapLayer(spills: SpillRecord[]): Array<{
  id: string;
  lat: number | null;
  lon: number | null;
  city: string;
  address: string | null;
  material: string;
  quantity: number | null;
  units: string | null;
  hazardClass: string;
  severity: string;
  spillDate: Date;
  color: number[];
}> {
  return spills.map((spill) => {
    const coords = geocodeSpill(spill);

    return {
      id: spill.id,
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
      city: spill.city,
      address: spill.address,
      material: spill.material,
      quantity: spill.quantity,
      units: spill.units,
      hazardClass: spill.hazardClass,
      severity: spill.severityLevel,
      spillDate: new Date(spill.spillDate),
      color: getSpillSeverityColor(spill.severityLevel),
    };
  });
}

/**
 * Gets recent spills for summary
 */
export function getRecentSpills(
  spills: SpillRecord[],
  limit: number = 5,
): SpillRecord[] {
  return spills
    .sort(
      (a, b) =>
        new Date(b.spillDate).getTime() - new Date(a.spillDate).getTime(),
    )
    .slice(0, limit);
}

/**
 * Gets spills by municipality
 */
export function getSpillsByMunicipality(
  spills: SpillRecord[],
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const spill of spills) {
    const city = spill.city;
    counts[city] = (counts[city] || 0) + 1;
  }

  return counts;
}
