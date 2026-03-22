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
var config = { runtime: "edge" };
var CACHE_TTL = 5 * 60;
async function handler(_req) {
  try {
    return jsonResponse(
      {
        incidents: [],
        total: 0,
        notice: "Toronto Fire CAD API is temporarily unavailable. The city is updating their data access systems. Service will resume once access is restored.",
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      },
      200,
      {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=30`
      }
    );
  } catch (error) {
    console.error("[Toronto Fire] Error:", error);
    return jsonResponse(
      {
        error: "Toronto Fire data temporarily unavailable",
        message: error.message,
        incidents: [],
        total: 0
      },
      503,
      {
        "Cache-Control": "no-cache, no-store"
      }
    );
  }
}
export {
  config,
  handler as default
};
