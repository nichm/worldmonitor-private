// api/toronto-water-level.js
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
var DFO_API_BASE = "https://api.iwls.dfo-mpo.gc.ca/api/v1";
var STATION_ID = "5160-DHO-002";
var CACHE_TTL = 3600;
async function fetchWaterLevelData() {
  try {
    const wloUrl = `${DFO_API_BASE}/stations/${STATION_ID}/wlo?time-range=24`;
    const [wloResp, wlpResp] = await Promise.all([
      fetch(wloUrl, {
        signal: AbortSignal.timeout(1e4),
        headers: { "Accept": "application/json" }
      }),
      fetch(`${DFO_API_BASE}/stations/${STATION_ID}/data/wlp?time-range=48`, {
        signal: AbortSignal.timeout(1e4),
        headers: { "Accept": "application/json" }
      })
    ]);
    if (!wloResp.ok) {
      throw new Error(`DFO WLO API error: ${wloResp.status}`);
    }
    const wloData = await wloResp.json();
    let wlpData = null;
    if (wlpResp.ok) {
      try {
        wlpData = await wlpResp.json();
      } catch (e) {
        console.warn("[Water Level] Failed to parse WLP data:", e);
      }
    }
    const latestObserved = wloData && wloData.length > 0 ? wloData[0] : null;
    const latestPredicted = wlpData && wlpData.length > 0 ? wlpData[0] : null;
    let deviation = null;
    if (latestObserved && latestPredicted) {
      const observedVal = latestObserved.QC !== "NQC" ? parseFloat(latestObserved.VALUE) : null;
      const predictedVal = parseFloat(latestPredicted.VALUE);
      if (observedVal !== null && !isNaN(observedVal) && !isNaN(predictedVal)) {
        deviation = observedVal - predictedVal;
      }
    }
    const currentReading = latestObserved ? {
      timestamp: latestObserved.TS,
      value: latestObserved.QC !== "NQC" ? parseFloat(latestObserved.VALUE) : null,
      qc: latestObserved.QC,
      isQualityControlled: latestObserved.QC === "QC" || latestObserved.QC === "FQC"
    } : null;
    const predictedReading = latestPredicted ? {
      timestamp: latestPredicted.TS,
      value: parseFloat(latestPredicted.VALUE)
    } : null;
    return {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      stationId: STATION_ID,
      stationName: "Toronto Harbour",
      currentReading,
      predictedReading,
      deviation,
      deviationThreshold: 0.3
      // meters
    };
  } catch (error) {
    console.error("[Water Level] Fetch failed:", error);
    throw error;
  }
}
async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getPublicCorsHeaders() });
  }
  try {
    const data = await fetchWaterLevelData();
    return jsonResponse(
      data,
      200,
      {
        "Cache-Control": `s-maxage=${CACHE_TTL}, stale-while-revalidate=${Math.floor(CACHE_TTL / 2)}`,
        ...getPublicCorsHeaders()
      }
    );
  } catch (error) {
    console.error("[Water Level] Error:", error);
    return jsonResponse(
      {
        error: "Water level data temporarily unavailable",
        message: error.message,
        stationId: STATION_ID,
        stationName: "Toronto Harbour"
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
