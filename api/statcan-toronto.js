// api/_json-response.js
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

// api/statcan-toronto.js
var STATCAN_WDS_BASE = "https://www150.statcan.gc.ca/t1/wds/rest";
var VECTORS = [
  "v41690973",
  // CPI - All-items, not seasonally adjusted, Toronto (Index, 2002=100)
  "v41690969",
  // CPI - Shelter, not seasonally adjusted, Toronto (Index, 2002=100)
  "v2062811",
  // Employment rate, persons aged 15 and over, Canada (percent)
  "v2062815",
  // Unemployment rate, persons aged 15 and over, Canada (percent)
  "v111955442"
  // NHPI - New Housing Price Index, Toronto (Index, 2016=100)
];
var config = { runtime: "edge" };
async function handler(req) {
  try {
    const requestBody = {
      vectorIds: VECTORS,
      latestNPeriods: 12
    };
    const url = `${STATCAN_WDS_BASE}/getDataFromVectorsAndLatestNPeriods`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor.app"
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      throw new Error(`StatCan WDS API returned ${response.status}: ${response.statusText}`);
    }
    const json = await response.json();
    if (!json.success || !json.result || !json.result.vectorData) {
      throw new Error("Invalid StatCan WDS response structure");
    }
    const indicators = json.result.vectorData.map((vec) => {
      const vectorId = vec.vectorId;
      const dataPoints = vec.vectorDataPoint;
      const sortedPoints = dataPoints.sort((a, b) => {
        const yearA = parseInt(a.refPeriod.slice(0, 4), 10);
        const monthA = parseInt(a.refPeriod.slice(4, 6), 10);
        const yearB = parseInt(b.refPeriod.slice(0, 4), 10);
        const monthB = parseInt(b.refPeriod.slice(4, 6), 10);
        return yearB - yearA || monthB - monthA;
      });
      const latest = sortedPoints[0];
      const previous = sortedPoints[1];
      let moMChange = null;
      let yoyChange = null;
      if (latest && previous) {
        moMChange = (latest.value - previous.value) / previous.value * 100;
      }
      if (sortedPoints.length >= 13) {
        const yearAgo = sortedPoints[12];
        if (latest && yearAgo) {
          yoyChange = (latest.value - yearAgo.value) / yearAgo.value * 100;
        }
      }
      return {
        vector_id: vectorId,
        name: getVectorName(vectorId),
        latest_value: latest?.value || null,
        latest_period: latest?.refPeriod || null,
        previous_value: previous?.value || null,
        previous_period: previous?.refPeriod || null,
        mom_change: moMChange ? Math.round(moMChange * 100) / 100 : null,
        yoy_change: yoyChange ? Math.round(yoyChange * 100) / 100 : null,
        // Include last 12 periods for sparkline
        sparkline: sortedPoints.slice(0, 12).map((p) => ({
          period: p.refPeriod,
          value: p.value
        }))
      };
    });
    const cpiIndicator = indicators.find((i) => i.vector_id === "v41690973");
    const unemploymentIndicator = indicators.find((i) => i.vector_id === "v2062815");
    const alerts = [];
    if (cpiIndicator && cpiIndicator.mom_change && cpiIndicator.mom_change > 0.5) {
      alerts.push({
        id: `statcan-cpi-mom-${Date.now()}`,
        type: "cpi_mom_spike",
        message: `Toronto CPI rose ${cpiIndicator.mom_change.toFixed(2)}% MoM`,
        severity: "critical",
        value: cpiIndicator.mom_change,
        threshold: 0.5,
        period: cpiIndicator.latest_period
      });
    }
    if (unemploymentIndicator && unemploymentIndicator.mom_change && Math.abs(unemploymentIndicator.mom_change) > 0.3) {
      alerts.push({
        id: `statcan-unemployment-${Date.now()}`,
        type: "unemployment_change",
        message: `Canada unemployment rate ${unemploymentIndicator.mom_change > 0 ? "increased" : "decreased"} by ${Math.abs(unemploymentIndicator.mom_change).toFixed(2)}pp`,
        severity: unemploymentIndicator.mom_change > 0.5 ? "critical" : "high",
        value: unemploymentIndicator.mom_change,
        threshold: 0.3,
        period: unemploymentIndicator.latest_period
      });
    }
    return jsonResponse({
      indicators,
      alerts,
      fetched_at: (/* @__PURE__ */ new Date()).toISOString()
    }, 200, {
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-if-error=172800",
      // 24 hours
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("StatCan API error:", error);
    return jsonResponse({ error: "Failed to fetch StatCan data", message: error.message }, 500, {
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-if-error=1200",
      "Access-Control-Allow-Origin": "*"
    });
  }
}
function getVectorName(vectorId) {
  const names = {
    "v41690973": "CPI All-items (Toronto)",
    "v41690969": "CPI Shelter (Toronto)",
    "v2062811": "Employment Rate (Canada)",
    "v2062815": "Unemployment Rate (Canada)",
    "v111955442": "NHPI New Housing (Toronto)"
  };
  return names[vectorId] || vectorId;
}
export {
  config,
  handler as default
};
