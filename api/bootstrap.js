// api/bootstrap.js
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
function getPublicCorsHeaders(methods = "GET, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-WorldMonitor-Key",
    "Access-Control-Max-Age": "86400"
  };
}
function isDisallowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}
const DESKTOP_ORIGIN_PATTERNS = [
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/
];
const BROWSER_ORIGIN_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  /^https:\/\/worldmonitor-[a-z0-9-]+-elie-[a-z0-9]+\.vercel\.app$/,
  ...process.env.NODE_ENV === "production" ? [] : [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/
  ]
];
function isDesktopOrigin(origin) {
  return Boolean(origin) && DESKTOP_ORIGIN_PATTERNS.some((p) => p.test(origin));
}
function isTrustedBrowserOrigin(origin) {
  return Boolean(origin) && BROWSER_ORIGIN_PATTERNS.some((p) => p.test(origin));
}
function extractOriginFromReferer(referer) {
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}
function validateApiKey(req, options = {}) {
  const forceKey = options.forceKey === true;
  const key = req.headers.get("X-WorldMonitor-Key");
  const origin = req.headers.get("Origin") || extractOriginFromReferer(req.headers.get("Referer")) || "";
  if (isDesktopOrigin(origin)) {
    if (!key) return { valid: false, required: true, error: "API key required for desktop access" };
    const validKeys = (process.env.WORLDMONITOR_VALID_KEYS || "").split(",").filter(Boolean);
    if (!validKeys.includes(key)) return { valid: false, required: true, error: "Invalid API key" };
    return { valid: true, required: true };
  }
  if (isTrustedBrowserOrigin(origin)) {
    if (forceKey && !key) {
      return { valid: false, required: true, error: "API key required" };
    }
    if (key) {
      const validKeys = (process.env.WORLDMONITOR_VALID_KEYS || "").split(",").filter(Boolean);
      if (!validKeys.includes(key)) return { valid: false, required: true, error: "Invalid API key" };
    }
    return { valid: true, required: forceKey };
  }
  if (key) {
    const validKeys = (process.env.WORLDMONITOR_VALID_KEYS || "").split(",").filter(Boolean);
    if (!validKeys.includes(key)) return { valid: false, required: true, error: "Invalid API key" };
    return { valid: true, required: true };
  }
  return { valid: false, required: true, error: "API key required" };
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
const BOOTSTRAP_CACHE_KEYS = {
  earthquakes: "seismology:earthquakes:v1",
  outages: "infra:outages:v1",
  serviceStatuses: "infra:service-statuses:v1",
  marketQuotes: "market:stocks-bootstrap:v1",
  commodityQuotes: "market:commodities-bootstrap:v1",
  sectors: "market:sectors:v1",
  etfFlows: "market:etf-flows:v1",
  macroSignals: "economic:macro-signals:v1",
  bisPolicy: "economic:bis:policy:v1",
  bisExchange: "economic:bis:eer:v1",
  bisCredit: "economic:bis:credit:v1",
  shippingRates: "supply_chain:shipping:v2",
  chokepoints: "supply_chain:chokepoints:v4",
  chokepointTransits: "supply_chain:chokepoint_transits:v1",
  minerals: "supply_chain:minerals:v2",
  giving: "giving:summary:v1",
  climateAnomalies: "climate:anomalies:v1",
  radiationWatch: "radiation:observations:v1",
  thermalEscalation: "thermal:escalation:v1",
  wildfires: "wildfire:fires:v1",
  cyberThreats: "cyber:threats-bootstrap:v2",
  techReadiness: "economic:worldbank-techreadiness:v1",
  progressData: "economic:worldbank-progress:v1",
  renewableEnergy: "economic:worldbank-renewable:v1",
  positiveGeoEvents: "positive_events:geo-bootstrap:v1",
  theaterPosture: "theater_posture:sebuf:stale:v1",
  riskScores: "risk:scores:sebuf:stale:v1",
  naturalEvents: "natural:events:v1",
  flightDelays: "aviation:delays-bootstrap:v1",
  insights: "news:insights:v1",
  predictions: "prediction:markets-bootstrap:v1",
  cryptoQuotes: "market:crypto:v1",
  cryptoSectors: "market:crypto-sectors:v1",
  defiTokens: "market:defi-tokens:v1",
  aiTokens: "market:ai-tokens:v1",
  otherTokens: "market:other-tokens:v1",
  gulfQuotes: "market:gulf-quotes:v1",
  stablecoinMarkets: "market:stablecoins:v1",
  unrestEvents: "unrest:events:v1",
  iranEvents: "conflict:iran-events:v1",
  ucdpEvents: "conflict:ucdp-events:v1",
  temporalAnomalies: "temporal:anomalies:v1",
  weatherAlerts: "weather:alerts:v1",
  spending: "economic:spending:v1",
  techEvents: "research:tech-events-bootstrap:v1",
  gdeltIntel: "intelligence:gdelt-intel:v1",
  correlationCards: "correlation:cards-bootstrap:v1",
  forecasts: "forecast:predictions:v2",
  securityAdvisories: "intelligence:advisories-bootstrap:v1",
  customsRevenue: "trade:customs-revenue:v1",
  sanctionsPressure: "sanctions:pressure:v1",
  consumerPricesOverview: "consumer-prices:overview:ae",
  consumerPricesCategories: "consumer-prices:categories:ae:30d",
  consumerPricesMovers: "consumer-prices:movers:ae:30d",
  consumerPricesSpread: "consumer-prices:retailer-spread:ae:essentials-ae",
  groceryBasket: "economic:grocery-basket:v1",
  bigmac: "economic:bigmac:v1",
  nationalDebt: "economic:national-debt:v1"
};
const SLOW_KEYS = /* @__PURE__ */ new Set([
  "bisPolicy",
  "bisExchange",
  "bisCredit",
  "minerals",
  "giving",
  "sectors",
  "etfFlows",
  "wildfires",
  "climateAnomalies",
  "radiationWatch",
  "thermalEscalation",
  "cyberThreats",
  "techReadiness",
  "progressData",
  "renewableEnergy",
  "naturalEvents",
  "cryptoQuotes",
  "cryptoSectors",
  "defiTokens",
  "aiTokens",
  "otherTokens",
  "gulfQuotes",
  "stablecoinMarkets",
  "unrestEvents",
  "ucdpEvents",
  "techEvents",
  "securityAdvisories",
  "customsRevenue",
  "sanctionsPressure",
  "consumerPricesOverview",
  "consumerPricesCategories",
  "consumerPricesMovers",
  "consumerPricesSpread",
  "groceryBasket",
  "bigmac",
  "nationalDebt"
]);
const FAST_KEYS = /* @__PURE__ */ new Set([
  "earthquakes",
  "outages",
  "serviceStatuses",
  "macroSignals",
  "chokepoints",
  "chokepointTransits",
  "marketQuotes",
  "commodityQuotes",
  "positiveGeoEvents",
  "riskScores",
  "flightDelays",
  "insights",
  "predictions",
  "iranEvents",
  "temporalAnomalies",
  "weatherAlerts",
  "spending",
  "theaterPosture",
  "gdeltIntel",
  "correlationCards",
  "forecasts",
  "shippingRates"
]);
const TIER_CACHE = {
  slow: "max-age=300, stale-while-revalidate=600, stale-if-error=3600",
  fast: "max-age=60, stale-while-revalidate=120, stale-if-error=900"
};
const TIER_CDN_CACHE = {
  slow: "public, s-maxage=7200, stale-while-revalidate=1800, stale-if-error=7200",
  fast: "public, s-maxage=600, stale-while-revalidate=120, stale-if-error=900"
};
const NEG_SENTINEL = "__WM_NEG__";
async function getCachedJsonBatch(keys) {
  const result = /* @__PURE__ */ new Map();
  if (keys.length === 0) return result;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return result;
  const pipeline = keys.map((k) => ["GET", k]);
  const resp = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(pipeline),
    signal: AbortSignal.timeout(3e3)
  });
  if (!resp.ok) return result;
  const data = await resp.json();
  for (let i = 0; i < keys.length; i++) {
    const raw = data[i]?.result;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== NEG_SENTINEL) result.set(keys[i], parsed);
      } catch {
      }
    }
  }
  return result;
}
async function handler(req) {
  if (isDisallowedOrigin(req))
    return new Response("Forbidden", { status: 403 });
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  const apiKeyResult = validateApiKey(req);
  if (apiKeyResult.required && !apiKeyResult.valid)
    return jsonResponse({ error: apiKeyResult.error }, 401, cors);
  const url = new URL(req.url);
  const tier = url.searchParams.get("tier");
  let registry;
  if (tier === "slow" || tier === "fast") {
    const tierSet = tier === "slow" ? SLOW_KEYS : FAST_KEYS;
    registry = Object.fromEntries(Object.entries(BOOTSTRAP_CACHE_KEYS).filter(([k]) => tierSet.has(k)));
  } else {
    const requested = url.searchParams.get("keys")?.split(",").filter(Boolean).sort();
    registry = requested ? Object.fromEntries(Object.entries(BOOTSTRAP_CACHE_KEYS).filter(([k]) => requested.includes(k))) : BOOTSTRAP_CACHE_KEYS;
  }
  const keys = Object.values(registry);
  const names = Object.keys(registry);
  let cached;
  try {
    cached = await getCachedJsonBatch(keys);
  } catch {
    return jsonResponse({ data: {}, missing: names }, 200, { ...cors, "Cache-Control": "no-cache" });
  }
  const data = {};
  const missing = [];
  for (let i = 0; i < names.length; i++) {
    const val = cached.get(keys[i]);
    if (val !== void 0) {
      if (names[i] === "forecasts" && val != null && "enrichmentMeta" in val) {
        const { enrichmentMeta: _stripped, ...rest } = val;
        data[names[i]] = rest;
      } else {
        data[names[i]] = val;
      }
    } else {
      missing.push(names[i]);
    }
  }
  const cacheControl = tier && TIER_CACHE[tier] || "public, s-maxage=600, stale-while-revalidate=120, stale-if-error=900";
  return jsonResponse({ data, missing }, 200, {
    ...getPublicCorsHeaders(),
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": tier && TIER_CDN_CACHE[tier] || TIER_CDN_CACHE.fast
  });
}
export {
  config,
  handler as default
};
