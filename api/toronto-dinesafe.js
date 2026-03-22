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
var CKAN_BASE_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca";
var DATASET_ID = "0a8693b9-33f6-4b0e-9e97-010502905f7c";
var TODAY = /* @__PURE__ */ new Date();
var FOURTEEN_DAYS_AGO = new Date(TODAY.getTime() - 14 * 24 * 60 * 60 * 1e3);
var SEED_DINESAFE_DATA = [
  {
    establishment_id: "10657713",
    establishment_name: "DOWNTOWN GRILL",
    establishment_address: "123 Bay Street, Unit 1",
    establishment_status: "Closed",
    inspection_date: "2025-03-19",
    severity: "S - Severe",
    action: "Closure Order",
    lat: 43.6489,
    lon: -79.3816,
    infraction_details: "Food premises not maintained - improper waste storage"
  },
  {
    establishment_id: "10823456",
    establishment_name: "QUICK BITE EXPRESS",
    establishment_address: "456 Yonge Street",
    establishment_status: "Closed",
    inspection_date: "2025-03-18",
    severity: "S - Severe",
    action: "Closure Order",
    lat: 43.7128,
    lon: -79.3907,
    infraction_details: "Failure to maintain temperature control of potentially hazardous foods"
  },
  {
    establishment_id: "10789012",
    establishment_name: "MARKET FRESH DELI",
    establishment_address: "789 King Street West",
    establishment_status: "Closed",
    inspection_date: "2025-03-17",
    severity: "S - Severe",
    action: "Closure Order",
    lat: 43.6456,
    lon: -79.4012,
    infraction_details: "Evidence of pest infestation in food preparation area"
  },
  {
    establishment_id: "10956789",
    establishment_name: "STREET SIDE CAFE",
    establishment_address: "321 Queen Street West",
    establishment_status: "Closed",
    inspection_date: "2025-03-15",
    severity: "M - Minor",
    action: "Notice to Comply",
    lat: 43.6498,
    lon: -79.3987,
    infraction_details: "Food handling area not maintained in a sanitary condition"
  },
  {
    establishment_id: "11012345",
    establishment_name: "BAYVIEW BISTRO",
    establishment_address: "555 Bloor Street West",
    establishment_status: "Closed",
    inspection_date: "2025-03-12",
    severity: "S - Severe",
    action: "Closure Order",
    lat: 43.6629,
    lon: -79.4012,
    infraction_details: "Failure to protect food from contamination and adulteration"
  }
];
var config = { runtime: "edge" };
async function handler(_req) {
  try {
    const url = `${CKAN_BASE_URL}/api/3/action/datastore_search`;
    const body = {
      resource_id: DATASET_ID,
      limit: 500,
      filters: { "Action": "Closure Order" }
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "worldmonitor.app",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2e4)
    });
    if (!response.ok) {
      throw new Error(`CKAN API returned ${response.status}: ${response.statusText}`);
    }
    const json = await response.json();
    if (!json.success || !json.result || !json.result.records) {
      throw new Error("Invalid CKAN response structure");
    }
    const fourteenDaysCutoff = FOURTEEN_DAYS_AGO.getTime();
    const closures = json.result.records.filter((record) => {
      const inspectionDate = record["Inspection Date"];
      if (!inspectionDate) return false;
      const recordDate = new Date(inspectionDate).getTime();
      return recordDate >= fourteenDaysCutoff && record.Latitude && record.Longitude;
    }).map((record) => ({
      establishment_id: record["Establishment ID"] || "",
      establishment_name: record["Establishment Name"] || "Unknown",
      establishment_address: record["Establishment Address"] || "",
      establishment_status: record["Establishment Status"] || "Closed",
      inspection_date: record["Inspection Date"] || "",
      severity: record.Severity || "Unknown",
      action: record.Action || "Closure Order",
      lat: parseFloat(record.Latitude),
      lon: parseFloat(record.Longitude),
      infraction_details: record["Infraction Details"] || null
    })).sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());
    if (closures.length === 0) {
      console.log("DineSafe API: No recent closures found, returning seed data");
      return jsonResponse({
        closures: [...SEED_DINESAFE_DATA],
        total: SEED_DINESAFE_DATA.length,
        fetched_at: TODAY.toISOString(),
        using_seed_data: true
      }, 200, {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-if-error=7200",
        "Access-Control-Allow-Origin": "*"
      });
    }
    return jsonResponse({
      closures,
      total: closures.length,
      fetched_at: TODAY.toISOString()
    }, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-if-error=7200",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("DineSafe API error:", error);
    return jsonResponse({
      closures: [...SEED_DINESAFE_DATA],
      total: SEED_DINESAFE_DATA.length,
      error: error.message,
      fetched_at: TODAY.toISOString(),
      using_seed_data: true
    }, 200, {
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-if-error=1200",
      "Access-Control-Allow-Origin": "*"
    });
  }
}
export {
  config,
  handler as default
};
