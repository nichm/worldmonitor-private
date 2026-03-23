// api/toronto-shelter.js
// Simple CSV parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

// Helper to get numeric value safely
function getNum(val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
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

const config = { runtime: "edge" };
const CACHE_TTL = 36e5; // 1 hour cache

// CSV URL for daily shelter occupancy (updated daily by City of Toronto)
const SHELTER_CSV_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/21c83b32-d5a8-4106-a54f-010dbe49f6f2/resource/ffd20867-6e3c-4074-8427-d63810edf231/download/daily-shelter-overnight-occupancy.csv";

let cached = null;
let cachedAt = 0;

async function fetchShelterData() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) {
    console.log("[Toronto Shelter] Using cached data");
    return cached;
  }

  try {
    console.log("[Toronto Shelter] Fetching latest CSV from City of Toronto");

    const resp = await fetch(SHELTER_CSV_URL, {
      signal: AbortSignal.timeout(30000),
      headers: { "Accept": "text/csv" }
    });

    if (!resp.ok) throw new Error(`CSV download failed: ${resp.status}`);

    const csvText = await resp.text();

    // Parse CSV to extract headers and all records
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error("No records found in CSV");
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);

    // Find field indices for faster lookup
    const getFieldIndex = (variations) => {
      for (const v of variations) {
        const idx = headers.findIndex(h => h.toUpperCase() === v.toUpperCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const dateIdx = getFieldIndex(['OCCUPANCY_DATE']);
    const sectorIdx = getFieldIndex(['SECTOR']);
    const capacityActualRoomIdx = getFieldIndex(['CAPACITY_ACTUAL_ROOM']);
    const capacityActualBedIdx = getFieldIndex(['CAPACITY_ACTUAL_BED']);
    const occupiedRoomsIdx = getFieldIndex(['OCCUPIED_ROOMS']);
    const occupiedBedsIdx = getFieldIndex(['OCCUPIED_BEDS']);
    const unavailableBedsIdx = getFieldIndex(['UNAVAILABLE_BEDS']);

    if (dateIdx === -1) {
      throw new Error("OCCUPANCY_DATE field not found in CSV");
    }

    // Pass 1: Find the latest date and collect records for that date
    let latestDate = '';
    const latestRecords = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length <= dateIdx) continue;

      const date = values[dateIdx];
      if (!date) continue;

      // Track the latest date
      if (!latestDate || date > latestDate) {
        latestDate = date;
        latestRecords.length = 0; // Clear previous records
      }

      // Collect records for the latest date
      if (date === latestDate) {
        latestRecords.push(values);
      }
    }

    if (!latestDate || latestRecords.length === 0) {
      throw new Error("No valid occupancy data found");
    }

    console.log(`[Toronto Shelter] Processing ${latestRecords.length} records for ${latestDate}`);

    // Pass 2: Aggregate by sector
    const sectorAggregates = {
      Men: { occupied: 0, capacity: 0 },
      Women: { occupied: 0, capacity: 0 },
      Youth: { occupied: 0, capacity: 0 },
      Families: { occupied: 0, capacity: 0 },
      Coed: { occupied: 0, capacity: 0 }
    };

    let totalOccupied = 0;
    let totalCapacity = 0;

    for (const values of latestRecords) {
      const sectorRaw = sectorIdx > -1 ? values[sectorIdx] : null;
      const sector = normalizeSector(sectorRaw);

      const capacityActualRoom = capacityActualRoomIdx > -1 ? getNum(values[capacityActualRoomIdx]) : 0;
      const capacityActualBed = capacityActualBedIdx > -1 ? getNum(values[capacityActualBedIdx]) : 0;
      const occupiedRooms = occupiedRoomsIdx > -1 ? getNum(values[occupiedRoomsIdx]) : 0;
      const occupiedBeds = occupiedBedsIdx > -1 ? getNum(values[occupiedBedsIdx]) : 0;
      const unavailableBeds = unavailableBedsIdx > -1 ? getNum(values[unavailableBedsIdx]) : 0;

      let occupied, capacity;

      if (capacityActualRoom > 0) {
        // Room-based shelter
        occupied = occupiedRooms;
        capacity = capacityActualRoom;
      } else {
        // Bed-based shelter
        occupied = occupiedBeds;
        const totalBeds = capacityActualBed;
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

    const sectorData = Object.entries(sectorAggregates)
      .filter(([_, data]) => data.capacity > 0)
      .map(([sector, data]) => ({
        sector,
        occupied: data.occupied,
        capacity: data.capacity,
        occupancy: Math.round((data.occupied / data.capacity) * 100)
      }));

    const citywideOccupancy = totalCapacity > 0
      ? Math.round((totalOccupied / totalCapacity) * 100)
      : 0;

    cached = {
      fetchedAt: new Date().toISOString(),
      asOf: latestDate,
      dataSource: "City of Toronto Daily Shelter CSV",
      citywide: {
        occupied: totalOccupied,
        capacity: totalCapacity,
        occupancy: citywideOccupancy
      },
      sectors: sectorData
    };

    cachedAt = now;
    console.log(`[Toronto Shelter] ✓ Updated: ${latestDate} | Citywide occupancy: ${citywideOccupancy}%`);

    return cached;
  } catch (error) {
    console.error("[Toronto Shelter] Fetch failed:", error);

    // Return cached data if available, even if expired
    if (cached) {
      console.log("[Toronto Shelter] Returning stale cached data");
      return cached;
    }

    // Return error response
    return {
      error: "Unable to fetch shelter data",
      fetchedAt: new Date().toISOString()
    };
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

  if (!data || data.error) {
    return jsonResponse(
      { error: data?.error || "Shelter data temporarily unavailable" },
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