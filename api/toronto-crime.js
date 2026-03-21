// api/toronto-crime.js
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
var ARCGIS_BASE_URL = "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0";
var CACHE_TTL = 6 * 60 * 60;
async function handler(req) {
  try {
    const now = /* @__PURE__ */ new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    const currentYearStart = `${currentYear}-01-01`;
    const currentYearEnd = now.toISOString().split("T")[0];
    const dayOfYear = Math.floor((now - new Date(currentYear, 0, 0)) / (1e3 * 60 * 60 * 24));
    const lastYearStart = `${lastYear}-01-01`;
    const lastYearEnd = new Date(lastYear, 0, dayOfYear).toISOString().split("T")[0];
    const currentYearQuery = `${ARCGIS_BASE_URL}/query`;
    const currentYearParams = new URLSearchParams({
      where: `event_date >= '${currentYearStart}' AND event_date <= '${currentYearEnd}'`,
      outStatistics: JSON.stringify([
        {
          onStatisticField: "mci_category",
          statisticType: "count",
          outStatisticFieldName: "count"
        },
        {
          onStatisticField: "mci_category",
          statisticType: "field",
          outStatisticFieldName: "category"
        }
      ]),
      groupByFieldsForStatistics: "mci_category",
      orderByFields: "count DESC",
      f: "json"
    });
    const lastYearParams = new URLSearchParams({
      where: `event_date >= '${lastYearStart}' AND event_date <= '${lastYearEnd}'`,
      outStatistics: JSON.stringify([
        {
          onStatisticField: "mci_category",
          statisticType: "count",
          outStatisticFieldName: "count"
        },
        {
          onStatisticField: "mci_category",
          statisticType: "field",
          outStatisticFieldName: "category"
        }
      ]),
      groupByFieldsForStatistics: "mci_category",
      orderByFields: "count DESC",
      f: "json"
    });
    const [currentYearResponse, lastYearResponse] = await Promise.all([
      fetch(`${currentYearQuery}?${currentYearParams}`, {
        headers: {
          "User-Agent": "worldmonitor.app"
        }
      }),
      fetch(`${ARCGIS_BASE_URL}/query?${lastYearParams}`, {
        headers: {
          "User-Agent": "worldmonitor.app"
        }
      })
    ]);
    if (!currentYearResponse.ok || !lastYearResponse.ok) {
      throw new Error(`ArcGIS API returned ${currentYearResponse.status}/${lastYearResponse.status}`);
    }
    const [currentYearData, lastYearData] = await Promise.all([
      currentYearResponse.json(),
      lastYearResponse.json()
    ]);
    if (!currentYearData.features || !lastYearData.features) {
      throw new Error("Invalid ArcGIS response structure");
    }
    const currentYearCounts = /* @__PURE__ */ new Map();
    for (const feature of currentYearData.features) {
      const attrs = feature.attributes;
      currentYearCounts.set(attrs.category, attrs.count);
    }
    const lastYearCounts = /* @__PURE__ */ new Map();
    for (const feature of lastYearData.features) {
      const attrs = feature.attributes;
      lastYearCounts.set(attrs.category, attrs.count);
    }
    const categories = /* @__PURE__ */ new Set([...currentYearCounts.keys(), ...lastYearCounts.keys()]);
    const crimeStats = [];
    for (const category of categories) {
      const currentCount = currentYearCounts.get(category) || 0;
      const lastCount = lastYearCounts.get(category) || 0;
      const delta = currentCount - lastCount;
      const deltaPct = lastCount > 0 ? delta / lastCount * 100 : currentCount > 0 ? 100 : 0;
      crimeStats.push({
        category: category || "Unknown",
        currentYtd: currentCount,
        lastYearYtd: lastCount,
        delta,
        deltaPct: Math.round(deltaPct * 10) / 10
      });
    }
    crimeStats.sort((a, b) => b.currentYtd - a.currentYtd);
    const totalCurrent = crimeStats.reduce((sum, cat) => sum + cat.currentYtd, 0);
    const totalLast = crimeStats.reduce((sum, cat) => sum + cat.lastYearYtd, 0);
    const totalDelta = totalCurrent - totalLast;
    const totalDeltaPct = totalLast > 0 ? totalDelta / totalLast * 100 : 0;
    return jsonResponse(
      {
        categories: crimeStats,
        totals: {
          currentYtd: totalCurrent,
          lastYearYtd: totalLast,
          delta: totalDelta,
          deltaPct: Math.round(totalDeltaPct * 10) / 10
        },
        period: {
          currentYearStart,
          currentYearEnd,
          lastYearStart,
          lastYearEnd
        }
      },
      200,
      {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-if-error=3600`
      }
    );
  } catch (error) {
    console.error("[Toronto Crime] Fetch failed:", error);
    return jsonResponse(
      { error: "Failed to fetch crime data", message: error.message, categories: [], totals: null },
      200,
      // Return 200 with empty data to avoid breaking the app
      {
        "Cache-Control": "public, max-age=300, stale-if-error=600"
      }
    );
  }
}
export {
  config,
  handler as default
};
