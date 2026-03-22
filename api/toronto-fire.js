// api/toronto-fire.js
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
const CKAN_BASE = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search";
const FIRE_INCIDENTS_RESOURCE_ID = "fa5c7de5-10f8-41cf-883a-9b30a67c7b56"; // Real fire incidents dataset (36,564 records)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cached = null;
let cachedAt = 0;

async function fetchFireIncidents() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) return cached;

  try {
    // Fetch last 30 days of incidents
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    const url = new URL(CKAN_BASE);
    url.searchParams.set("resource_id", FIRE_INCIDENTS_RESOURCE_ID);
    url.searchParams.set("limit", "100");
    url.searchParams.set("fields", "Incident_Number,Initial_CAD_Event_Type,Final_Incident_Type,Incident_Station_Area,Incident_Ward,Intersection,Latitude,Longitude,TFS_Alarm_Time,TFS_Arrival_Time,Status_of_Fire_On_Arrival,Number_of_responding_apparatus,Number_of_responding_personnel");

    const resp = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: { "Accept": "application/json" }
    });

    if (!resp.ok) throw new Error(`CKAN API error: ${resp.status}`);

    const data = await resp.json();
    if (!data.success || !data.result?.records) {
      throw new Error("Invalid CKAN response");
    }

    const records = data.result.records;

    // Filter to last 30 days and only records with coordinates
    const recentIncidents = records
      .filter(r => r.TFS_Alarm_Time && r.TFS_Alarm_Time.startsWith(cutoffDate))
      .filter(r => r.Latitude && r.Longitude)
      .map(r => ({
        id: r.Incident_Number,
        time: r.TFS_Alarm_Time,
        address: r.Intersection || `${r.Incident_Station_Area} (Station Area ${r.Incident_Station_Area})`,
        alarm: parseAlarmLevel(r.Status_of_Fire_On_Arrival, r.Initial_CAD_Event_Type, r.Number_of_responding_apparatus),
        incidentType: r.Final_Incident_Type || r.Initial_CAD_Event_Type || "Fire",
        lat: parseFloat(r.Latitude),
        lon: parseFloat(r.Longitude),
        timestamp: new Date(r.TFS_Alarm_Time).getTime()
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first

    cached = {
      incidents: recentIncidents,
      total: recentIncidents.length,
      asOf: cutoffDate,
      lastUpdated: new Date().toISOString(),
      dataSource: "Toronto Fire Incidents (CKAN)"
    };

    cachedAt = now;
    return cached;
  } catch (error) {
    console.error("[Toronto Fire] CKAN fetch failed:", error);
    // Return empty with error message
    return {
      incidents: [],
      total: 0,
      error: "Fire data temporarily unavailable",
      lastUpdated: new Date().toISOString(),
      dataSource: "Toronto Fire Incidents (CKAN)"
    };
  }
}

function parseAlarmLevel(status, cadType, apparatusCount) {
  if (!status && !cadType) return 1;

  const statusNum = status ? parseInt(status.split('-')[0] || '0') : 0;
  const hasCriticalWords = cadType && (
    cadType.includes('High Rise') ||
    cadType.includes('Working Fire') ||
    cadType.includes('Structure Fire')
  );

  // Map CKAN status codes to alarm levels (1-4, matching original format)
  if (statusNum >= 7 || hasCriticalWords) return 4;
  if (statusNum >= 5) return 3;
  if (statusNum >= 3) return 2;
  if (apparatusCount && apparatusCount >= 3) return 2;
  return 1;
}

async function handler(req) {
  const corsHeaders = getCorsHeaders(req, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (isDisallowedOrigin(req)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }

  const data = await fetchFireIncidents();

  return jsonResponse(
    data,
    data.error ? 503 : 200,
    {
      "Cache-Control": `public, max-age=${CACHE_TTL / 1000}, s-maxage=${CACHE_TTL / 1000}, stale-while-revalidate=30`,
      ...corsHeaders
    }
  );
}

export {
  config,
  handler as default
};
