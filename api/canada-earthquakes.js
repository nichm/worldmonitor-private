// api/canada-earthquakes.js
function getPublicCorsHeaders(methods = "GET, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-WorldMonitor-Key",
    "Access-Control-Max-Age": "86400"
  };
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
var config = { runtime: "edge" };
var NRCAN_API_URL = "https://www.earthquakescanada.nrcan.gc.ca/api/v2/locations/30d.json";
var CACHE_TTL = 1800;
var GTA_BOUNDS = {
  latMin: 43.3,
  latMax: 44.2,
  lonMin: -80,
  lonMax: -78.7
};
var TORONTO_CENTER = {
  lat: 43.6532,
  lon: -79.3832
};
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
function filterEarthquakes(events) {
  return events.filter((event) => {
    const lat = event.latitude;
    const lon = event.longitude;
    if (lat === null || lon === null) return false;
    const inGTA = lat >= GTA_BOUNDS.latMin && lat <= GTA_BOUNDS.latMax && lon >= GTA_BOUNDS.lonMin && lon <= GTA_BOUNDS.lonMax;
    if (inGTA) return true;
    const distance = calculateDistance(lat, lon, TORONTO_CENTER.lat, TORONTO_CENTER.lon);
    return distance <= 150;
  });
}
function classifyEarthquake(event) {
  const mag = event.magnitude;
  const lat = event.latitude;
  const lon = event.longitude;
  const inGTA = lat >= GTA_BOUNDS.latMin && lat <= GTA_BOUNDS.latMax && lon >= GTA_BOUNDS.lonMin && lon <= GTA_BOUNDS.lonMax;
  const distance = calculateDistance(lat, lon, TORONTO_CENTER.lat, TORONTO_CENTER.lon);
  if (inGTA && mag >= 3) {
    return "PRIORITY";
  }
  if (distance <= 50 && mag >= 2) {
    return "ROUTINE";
  }
  if (distance <= 150 && mag >= 1.5) {
    return "INFO";
  }
  return "NONE";
}
async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getPublicCorsHeaders() });
  }
  try {
    const response = await fetch(NRCAN_API_URL, {
      signal: AbortSignal.timeout(15e3),
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error(`NRCan API error: ${response.status}`);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.locations)) {
      throw new Error("Invalid NRCan response format");
    }
    const filtered = filterEarthquakes(data.locations);
    const classified = filtered.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      magnitude: event.magnitude,
      depth: event.depth,
      latitude: event.latitude,
      longitude: event.longitude,
      location: event.location,
      felt: event.felt || false,
      quality: event.quality,
      alertLevel: classifyEarthquake(event)
    }));
    classified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return jsonResponse(
      {
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
        earthquakes: classified,
        gtaBounds: GTA_BOUNDS,
        total: classified.length,
        priorityCount: classified.filter((e) => e.alertLevel === "PRIORITY").length,
        routineCount: classified.filter((e) => e.alertLevel === "ROUTINE").length
      },
      200,
      {
        "Cache-Control": `s-maxage=${CACHE_TTL}, stale-while-revalidate=${Math.floor(CACHE_TTL / 2)}`,
        ...getPublicCorsHeaders()
      }
    );
  } catch (error) {
    console.error("[Earthquakes] Fetch failed:", error);
    return jsonResponse(
      {
        error: "Earthquake data temporarily unavailable",
        message: error.message,
        earthquakes: [],
        total: 0,
        priorityCount: 0,
        routineCount: 0
      },
      503,
      {
        "Cache-Control": "no-cache, no-store",
        ...getPublicCorsHeaders()
      }
    );
  }
}
export {
  config,
  handler as default
};
