// api/data/toronto-fire-live.json
var toronto_fire_live_default = {
  incidents: [
    {
      prime_street: "&#x20;",
      cross_street: "/",
      dispatch_time: "2026-03-23T09:11:59",
      incident_number: "F26042415",
      incident_type: "Vehicle - Personal Injury Highway",
      alarm_level: "0",
      area: "135",
      dispatched_units: "A135, P135",
      units: [
        "A135",
        "P135"
      ],
      timestamp: 1774271519e3
    },
    {
      prime_street: "M4J",
      cross_street: "",
      dispatch_time: "2026-03-23T09:28:08",
      incident_number: "F26042419",
      incident_type: "MEDICAL",
      alarm_level: "0",
      area: "323",
      dispatched_units: "HZ323",
      units: [
        "HZ323"
      ],
      timestamp: 1774272488e3
    },
    {
      prime_street: "EGLINTON AVE, SC",
      cross_street: "BIRCHMOUNT RD / ROSEMOUNT DR",
      dispatch_time: "2026-03-23T09:31:57",
      incident_number: "F26042420",
      incident_type: "Alarm Single Source",
      alarm_level: "0",
      area: "222",
      dispatched_units: "P221, P222",
      units: [
        "P221",
        "P222"
      ],
      timestamp: 1774272717e3
    },
    {
      prime_street: "M2R",
      cross_street: "",
      dispatch_time: "2026-03-23T09:33:43",
      incident_number: "F26042421",
      incident_type: "MEDICAL",
      alarm_level: "0",
      area: "112",
      dispatched_units: "P112",
      units: [
        "P112"
      ],
      timestamp: 1774272823e3
    },
    {
      prime_street: "KENNEDY RD, SC",
      cross_street: "KINGSDOWN DR / JACK GOODLAD PARK TRL",
      dispatch_time: "2026-03-23T09:45:09",
      incident_number: "F26042425",
      incident_type: "Hazmat Level 1",
      alarm_level: "0",
      area: "221",
      dispatched_units: "P221",
      units: [
        "P221"
      ],
      timestamp: 1774273509e3
    },
    {
      prime_street: "M6K",
      cross_street: "",
      dispatch_time: "2026-03-23T09:47:43",
      incident_number: "F26042426",
      incident_type: "MEDICAL",
      alarm_level: "0",
      area: "426",
      dispatched_units: "P426",
      units: [
        "P426"
      ],
      timestamp: 1774273663e3
    },
    {
      prime_street: "M8Z",
      cross_street: "",
      dispatch_time: "2026-03-23T09:50:41",
      incident_number: "F26042427",
      incident_type: "MEDICAL",
      alarm_level: "0",
      area: "433",
      dispatched_units: "A433",
      units: [
        "A433"
      ],
      timestamp: 1774273841e3
    },
    {
      prime_street: "YONGE ST, TT",
      cross_street: "SOUDAN AVE / EGLINTON AVE W",
      dispatch_time: "2026-03-23T09:53:27",
      incident_number: "F26042428",
      incident_type: "Alarm Single Source",
      alarm_level: "0",
      area: "134",
      dispatched_units: "P134, P311",
      units: [
        "P134",
        "P311"
      ],
      timestamp: 1774274007e3
    },
    {
      prime_street: "M6L",
      cross_street: "",
      dispatch_time: "2026-03-23T09:53:57",
      incident_number: "F26042429",
      incident_type: "MEDICAL",
      alarm_level: "0",
      area: "146",
      dispatched_units: "P146",
      units: [
        "P146"
      ],
      timestamp: 1774274037e3
    }
  ],
  total: 9,
  fetched_at: "2026-03-23T14:01:54.190Z",
  last_updated: "2026-03-23T14:01:54.191Z",
  data_source: "Toronto Fire Services CAD (Live - updates every 5 minutes)"
};

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
var config = { runtime: "edge" };
async function handler(req) {
  const corsHeaders = getCorsHeaders(req, "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (isDisallowedOrigin(req)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }
  try {
    console.log(`Toronto Fire API: Serving ${toronto_fire_live_default.incidents?.length || 0} live incidents`);
    return jsonResponse(
      {
        incidents: (toronto_fire_live_default.incidents || []).map((inc) => ({
          id: inc.incident_number,
          prime_street: inc.prime_street,
          cross_street: inc.cross_street,
          time: inc.dispatch_time,
          address: `${inc.prime_street} @ ${inc.cross_street}`,
          alarm: parseInt(inc.alarm_level) || 1,
          incident_type: inc.incident_type,
          area: inc.area,
          dispatched_units: inc.dispatched_units,
          timestamp: new Date(inc.dispatch_time).getTime()
        })),
        total: toronto_fire_live_default.total || 0,
        asOf: toronto_fire_live_default.fetched_at || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        lastUpdated: toronto_fire_live_default.fetched_at || (/* @__PURE__ */ new Date()).toISOString(),
        dataSource: "Toronto Fire Services CAD (Live - updates every 5 minutes)"
      },
      200,
      {
        "X-Data-Source": "Toronto Fire Services CAD (Live)",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-if-error=7200",
        ...corsHeaders
      }
    );
  } catch (error) {
    console.error("Toronto Fire API error:", error);
    return jsonResponse(
      {
        incidents: [],
        total: 0,
        error: "Fire data temporarily unavailable",
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        dataSource: "Toronto Fire Incidents (City Open Data)"
      },
      503,
      {
        "X-Data-Source": "fallback-data",
        "Cache-Control": "public, max-age=300, s-maxage=600, stale-if-error=1200",
        ...corsHeaders
      }
    );
  }
}
export {
  config,
  handler as default
};
