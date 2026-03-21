// api/reverse-geocode.js
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
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";
const CHROME_UA = "WorldMonitor/2.0 (https://worldmonitor.app)";
async function handler(req, ctx) {
  if (isDisallowedOrigin(req))
    return new Response("Forbidden", { status: 403 });
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  const latN = Number(lat);
  const lonN = Number(lon);
  if (!lat || !lon || Number.isNaN(latN) || Number.isNaN(lonN) || latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
    return jsonResponse({ error: "valid lat (-90..90) and lon (-180..180) required" }, 400, cors);
  }
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const cacheKey = `geocode:${latN.toFixed(1)},${lonN.toFixed(1)}`;
  if (redisUrl && redisToken) {
    try {
      const cached = await fetch(`${redisUrl}/get/${encodeURIComponent(cacheKey)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        signal: AbortSignal.timeout(1500)
      });
      if (cached.ok) {
        const data = await cached.json();
        if (data.result) {
          return new Response(data.result, {
            status: 200,
            headers: {
              ...cors,
              "Content-Type": "application/json",
              "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600"
            }
          });
        }
      }
    } catch {
    }
  }
  try {
    const resp = await fetch(
      `${NOMINATIM_BASE}?lat=${latN}&lon=${lonN}&format=json&zoom=3&accept-language=en`,
      {
        headers: { "User-Agent": CHROME_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(8e3)
      }
    );
    if (!resp.ok) {
      return jsonResponse({ error: `Nominatim ${resp.status}` }, 502, cors);
    }
    const data = await resp.json();
    const country = data.address?.country;
    const code = data.address?.country_code?.toUpperCase();
    const result = { country: country || null, code: code || null, displayName: data.display_name || country || "" };
    const body = JSON.stringify(result);
    if (redisUrl && redisToken && country && code) {
      ctx.waitUntil(
        fetch(redisUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(["SET", cacheKey, body, "EX", 604800]),
          signal: AbortSignal.timeout(5e3)
        }).catch(() => {
        })
      );
    }
    return new Response(body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600"
      }
    });
  } catch (err) {
    return jsonResponse({ error: "Nominatim request failed" }, 502, cors);
  }
}
export {
  config,
  handler as default
};
