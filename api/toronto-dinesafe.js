// api/toronto-dinesafe.js
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
const CKAN_BASE_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca";
const DATASET_ID = "dinesafe";
const TODAY = /* @__PURE__ */ new Date();
const FOURTEEN_DAYS_AGO = new Date(TODAY.getTime() - 14 * 24 * 60 * 60 * 1e3);
function formatDate(date) {
  return date.toISOString().split("T")[0];
}
const config = { runtime: "edge" };
async function handler(_req) {
  try {
    const query = {
      resource_id: DATASET_ID,
      sql: `
        SELECT
          ESTABLISHMENT_ID,
          ESTABLISHMENT_NAME,
          ESTABLISHMENT_ADDRESS,
          ESTABLISHMENT_STATUS,
          INSPECTION_DATE,
          SEVERITY,
          ACTION,
          LATITUDE,
          LONGITUDE,
          INFRACTION_DETAILS
        FROM "${DATASET_ID}"
        WHERE ESTABLISHMENT_STATUS = 'Closed'
          AND INSPECTION_DATE >= '${formatDate(FOURTEEN_DAYS_AGO)}'
        ORDER BY INSPECTION_DATE DESC
        LIMIT 100
      `.trim().replace(/\s+/g, " ")
    };
    const url = `${CKAN_BASE_URL}/api/action/datastore_sql?q=${encodeURIComponent(query.sql)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "worldmonitor.app"
      }
    });
    if (!response.ok) {
      throw new Error(`CKAN API returned ${response.status}: ${response.statusText}`);
    }
    const json = await response.json();
    if (!json.success || !json.result || !json.result.records) {
      throw new Error("Invalid CKAN response structure");
    }
    const closures = json.result.records.filter((record) => record.LATITUDE && record.LONGITUDE).map((record) => ({
      establishment_id: record.ESTABLISHMENT_ID || "",
      establishment_name: record.ESTABLISHMENT_NAME || "Unknown",
      establishment_address: record.ESTABLISHMENT_ADDRESS || "",
      establishment_status: record.ESTABLISHMENT_STATUS || "Closed",
      inspection_date: record.INSPECTION_DATE || "",
      severity: record.SEVERITY || "Unknown",
      action: record.ACTION || "Closure Order",
      lat: parseFloat(record.LATITUDE),
      lon: parseFloat(record.LONGITUDE),
      infraction_details: record.INFRACTION_DETAILS || null
    }));
    return jsonResponse(closures, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-if-error=7200",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("DineSafe API error:", error);
    return jsonResponse({ error: "Failed to fetch DineSafe data", message: error.message }, 500, {
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-if-error=1200",
      "Access-Control-Allow-Origin": "*"
    });
  }
}
export {
  config,
  handler as default
};
