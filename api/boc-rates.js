// api/boc-rates.js
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
const BOC_VALET_BASE = "https://www.bankofcanada.ca/valet/observations";
const CACHE_TTL = 36e5;
let cached = null;
let cachedAt = 0;
async function fetchBocRates() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) return cached;
  try {
    const seriesCode = "FXCADUSD,FXCADEUR,AUCAL";
    const url = `${BOC_VALET_BASE}/${seriesCode}/json?recent=5`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(3e4),
      headers: { "Accept": "application/json" }
    });
    if (!resp.ok) throw new Error(`BoC API error: ${resp.status}`);
    const data = await resp.json();
    if (!data?.observations) {
      throw new Error("Invalid BoC response");
    }
    const observations = data.observations;
    const latest = observations[0];
    if (!latest) throw new Error("No observations found");
    const fxUsdRate = latest["FXCADUSD"]?.v ? parseFloat(latest["FXCADUSD"].v) : null;
    const fxEurRate = latest["FXCADEUR"]?.v ? parseFloat(latest["FXCADEUR"].v) : null;
    const overnightRate = latest["AUCAL"]?.v ? parseFloat(latest["AUCAL"].v) : null;
    const rateHistory = observations.slice(0, 5).map((obs) => ({
      d: obs.d,
      fxUsd: obs["FXCADUSD"]?.v ? parseFloat(obs["FXCADUSD"].v) : null,
      fxEur: obs["FXCADEUR"]?.v ? parseFloat(obs["FXCADEUR"].v) : null,
      overnight: obs["AUCAL"]?.v ? parseFloat(obs["AUCAL"].v) : null
    })).filter((h) => h.overnight !== null);
    const previousOvernight = rateHistory[1]?.overnight;
    const rateChanged = previousOvernight !== null && previousOvernight !== overnightRate;
    cached = {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      observations: rateHistory,
      latest: {
        date: latest.d,
        fxUsdRate,
        fxEurRate,
        overnightRate
      },
      rateChanged,
      previousOvernightRate: previousOvernight
    };
    cachedAt = now;
    return cached;
  } catch (error) {
    console.error("[Bank of Canada] Fetch failed:", error);
    return cached ?? null;
  }
}
async function handler(req) {
  const corsHeaders = getCorsHeaders(req, "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (isDisallowedOrigin(req)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }
  const data = await fetchBocRates();
  if (!data) {
    return jsonResponse(
      { error: "Bank of Canada data temporarily unavailable" },
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
