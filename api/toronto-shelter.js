// api/toronto-shelter.js
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  /^https:\/\/worldmonitor-[a-z0-9-]+-elie-[a-z0-9]+\.vercel\.app$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/
];
function isAllowedOrigin(origin) {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}
function getCorsHeaders(req, methods = "GET, OPTIONS") {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isAllowedOrigin(origin) ? origin : "https://worldmonitor.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-WorldMonitor-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function isDisallowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}
function sanitizeJsonValue(value, depth = 0) {
  if (depth > 20) return "[truncated]";
  if (value instanceof Error) {
    return { error: value.message };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const clone = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "stack" || key === "stackTrace" || key === "cause") continue;
      clone[key] = sanitizeJsonValue(nested, depth + 1);
    }
    return clone;
  }
  return value;
}
function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(sanitizeJsonValue(body)), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
const config = { runtime: "edge" };
const CKAN_BASE = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search";
const CACHE_TTL = 36e5;
let cached = null;
let cachedAt = 0;

// Updated to 2025 dataset resource ID
const SHELTER_RESOURCE_ID = "5dc4fbfc-0951-45e8-ae30-962af9dcaf7c";
async function fetchShelterData() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) return cached;
  try {
    const yesterday = /* @__PURE__ */ new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];
    const url = new URL(CKAN_BASE);
    url.searchParams.set("resource_id", SHELTER_RESOURCE_ID);
    url.searchParams.set("limit", "1000");
    const resp = await fetch(url.toString(), {
      signal: AbortSignal.timeout(3e4),
      headers: { "Accept": "application/json" }
    });
    if (!resp.ok) throw new Error(`CKAN API error: ${resp.status}`);
    const data = await resp.json();
    if (!data.success || !data.result?.records) {
      throw new Error("Invalid CKAN response");
    }
    const records = data.result.records;
    const yesterdayRecords = records.filter((r) => r.OCCUPANCY_DATE === yesterdayDate);
    if (yesterdayRecords.length === 0) {
      const latestDate = records[0]?.OCCUPANCY_DATE;
      if (!latestDate) {
        throw new Error("No valid occupancy data found");
      }
      console.warn(`[Toronto Shelter] No data for ${yesterdayDate}, falling back to ${latestDate}`);
      yesterdayRecords.push(...records.filter((r) => r.OCCUPANCY_DATE === latestDate));
    }
    const sectorAggregates = {
      Men: { occupied: 0, capacity: 0 },
      Women: { occupied: 0, capacity: 0 },
      Youth: { occupied: 0, capacity: 0 },
      Families: { occupied: 0, capacity: 0 },
      Coed: { occupied: 0, capacity: 0 }
    };
    let totalOccupied = 0;
    let totalCapacity = 0;
    for (const record of yesterdayRecords) {
      const sector = normalizeSector(record.SECTOR);
      const isRoomBased = Number(record.CAPACITY_ACTUAL_ROOM) > 0;
      let occupied, capacity;
      if (isRoomBased) {
        occupied = Number(record.OCCUPIED_ROOMS) || 0;
        capacity = Number(record.CAPACITY_ACTUAL_ROOM) || 0;
      } else {
        occupied = Number(record.OCCUPIED_BEDS) || 0;
        const totalBeds = Number(record.CAPACITY_ACTUAL_BED) || 0;
        const unavailableBeds = Number(record.UNAVAILABLE_BEDS) || 0;
        capacity = Math.max(0, totalBeds - unavailableBeds);
      }
      if (sectorAggregates[sector] && capacity > 0) {
        sectorAggregates[sector].occupied += occupied;
        sectorAggregates[sector].capacity += capacity;
      }
      if (capacity > 0) {
        totalOccupied += occupied;
        totalCapacity += capacity;
      }
    }
    const sectorData = Object.entries(sectorAggregates).filter(([_, data2]) => data2.capacity > 0).map(([sector, data2]) => ({
      sector,
      occupied: data2.occupied,
      capacity: data2.capacity,
      occupancy: Math.round(data2.occupied / data2.capacity * 100)
    }));
    const citywideOccupancy = totalCapacity > 0 ? Math.round(totalOccupied / totalCapacity * 100) : 0;
    const asOfDate = yesterdayRecords[0]?.OCCUPANCY_DATE || yesterdayDate;
    cached = {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      asOf: asOfDate,
      citywide: {
        occupied: totalOccupied,
        capacity: totalCapacity,
        occupancy: citywideOccupancy
      },
      sectors: sectorData
    };
    cachedAt = now;
    return cached;
  } catch (error) {
    console.error("[Toronto Shelter] Fetch failed:", error);
    return cached ?? null;
  }
}
function normalizeSector(sector) {
  if (!sector) return "Coed";
  const s = sector.toLowerCase();
  if (s.includes("men") || s.includes("male")) return "Men";
  if (s.includes("women") || s.includes("female")) return "Women";
  if (s.includes("youth")) return "Youth";
  if (s.includes("famil")) return "Families";
  return "Coed";
}
async function handler(req) {
  const corsHeaders = getCorsHeaders(req, "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (isDisallowedOrigin(req)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }
  const data = await fetchShelterData();
  if (!data) {
    return jsonResponse(
      { error: "Shelter data temporarily unavailable" },
      503,
      { "Cache-Control": "no-cache, no-store", ...corsHeaders }
    );
  }
  return jsonResponse(
    data,
    200,
    {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=1800, stale-if-error=3600",
      ...corsHeaders
    }
  );
}
export {
  config,
  handler as default
};
