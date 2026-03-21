// api/toronto-geocode.js
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
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "WorldMonitor/1.0 (geocoding service)";
const CACHE_TTL = 7 * 24 * 60 * 60;
const geocodeCache = /* @__PURE__ */ new Map();
async function handler(req) {
  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    if (!address) {
      return jsonResponse({ error: "Missing address parameter" }, 400);
    }
    const cacheKey = address.toLowerCase().trim();
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1e3) {
      return jsonResponse(
        cached.data,
        200,
        {
          "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
          "X-Cache": "HIT"
        }
      );
    }
    const searchQuery = `${address}, Toronto, Ontario, Canada`;
    const searchParams = new URLSearchParams({
      q: searchQuery,
      format: "json",
      limit: "1",
      addressdetails: "1"
    });
    const nomUrl = `${NOMINATIM_BASE}?${searchParams.toString()}`;
    const response = await fetch(nomUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(5e3)
      // 5 second timeout
    });
    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      const emptyResult = {
        lat: null,
        lon: null,
        display_name: null,
        error: "Location not found"
      };
      geocodeCache.set(cacheKey, {
        timestamp: Date.now(),
        data: emptyResult
      });
      return jsonResponse(
        emptyResult,
        200,
        {
          "Cache-Control": `public, max-age=3600, s-maxage=3600`,
          "X-Cache": "MISS"
        }
      );
    }
    const result = data[0];
    const geocodeResult = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      address: {
        road: result.address?.road || null,
        suburb: result.address?.suburb || result.address?.city_district || null,
        city: result.address?.city || result.address?.town || null,
        postcode: result.address?.postcode || null
      }
    };
    geocodeCache.set(cacheKey, {
      timestamp: Date.now(),
      data: geocodeResult
    });
    return jsonResponse(
      geocodeResult,
      200,
      {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
        "X-Cache": "MISS"
      }
    );
  } catch (error) {
    console.error("[Toronto Geocode] Failed:", error);
    return jsonResponse(
      {
        lat: null,
        lon: null,
        display_name: null,
        error: error.message || "Geocoding failed"
      },
      200,
      // Return 200 to avoid breaking the app
      {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=30"
      }
    );
  }
}
export {
  config,
  handler as default
};
