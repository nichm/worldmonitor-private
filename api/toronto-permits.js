// api/toronto-permits.js
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
async function fetchPermitData() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) return cached;
  try {
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(endDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    const sqlQuery = `
      SELECT
        "PERMIT_TYPE",
        "DWELLING_UNITS_PROPOSED",
        "DATE_INSERTED",
        "STREET_NAME",
        "WARD_NAME"
      FROM "ce8aac89-7e15-49e8-9532-e928d040885f"
      WHERE "PERMIT_TYPE" = 'New Building'
        AND "DWELLING_UNITS_PROPOSED" IS NOT NULL
        AND CAST("DWELLING_UNITS_PROPOSED" AS INTEGER) > 0
        AND "DATE_INSERTED" >= '${startDateStr}'
        AND "DATE_INSERTED" <= '${endDateStr}'
      ORDER BY CAST("DWELLING_UNITS_PROPOSED" AS INTEGER) DESC, "DATE_INSERTED" DESC
      LIMIT 50
    `;
    const url = new URL(CKAN_BASE.replace("datastore_search", "datastore_search_sql"));
    url.searchParams.set("sql", sqlQuery);
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
    let totalUnits = 0;
    const permits = records.map((record) => {
      const units = parseInt(record.DWELLING_UNITS_PROPOSED, 10) || 0;
      totalUnits += units;
      return {
        permitType: record.PERMIT_TYPE,
        dwellingUnits: units,
        date: record.DATE_INSERTED,
        street: record.STREET_NAME || "Unknown",
        ward: record.WARD_NAME || "Unknown"
      };
    });
    cached = {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      startDate: startDateStr,
      endDate: endDateStr,
      totalUnits,
      permits: permits.slice(0, 50)
    };
    cachedAt = now;
    return cached;
  } catch (error) {
    console.error("[Toronto Permits] Fetch failed:", error);
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
  const data = await fetchPermitData();
  if (!data) {
    return jsonResponse(
      { error: "Building permit data temporarily unavailable" },
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
