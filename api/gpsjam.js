// api/gpsjam.js
var ALLOWED_ORIGIN_PATTERNS = [
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
async function readJsonFromUpstash(key, timeoutMs = 3e3) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data.result) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}
var config = { runtime: "edge" };
var REDIS_KEY = "intelligence:gpsjam:v2";
var REDIS_KEY_V1 = "intelligence:gpsjam:v1";
var cached = null;
var cachedAt = 0;
var CACHE_TTL = 3e5;
var negUntil = 0;
var NEG_TTL = 6e4;
async function fetchGpsJamData() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) return cached;
  if (now < negUntil) return null;
  let data;
  try {
    data = await readJsonFromUpstash(REDIS_KEY);
  } catch {
    data = null;
  }
  if (!data) {
    let v1;
    try {
      v1 = await readJsonFromUpstash(REDIS_KEY_V1);
    } catch {
      v1 = null;
    }
    if (v1?.hexes) {
      data = {
        ...v1,
        source: v1.source || "gpsjam.org (normalized)",
        hexes: v1.hexes.map((hex) => {
          if ("npAvg" in hex) return hex;
          const pct = hex.pct || 0;
          return {
            h3: hex.h3,
            lat: hex.lat,
            lon: hex.lon,
            level: hex.level,
            region: hex.region,
            npAvg: pct > 10 ? 0.3 : pct >= 2 ? 0.8 : 1.5,
            sampleCount: hex.bad || 0,
            aircraftCount: hex.total || 0
          };
        })
      };
    }
  }
  if (!data) {
    negUntil = now + NEG_TTL;
    return null;
  }
  cached = data;
  cachedAt = now;
  return data;
}
async function handler(req) {
  const corsHeaders = getCorsHeaders(req, "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (isDisallowedOrigin(req)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }
  const data = await fetchGpsJamData();
  if (!data) {
    return jsonResponse(
      { error: "GPS interference data temporarily unavailable" },
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
