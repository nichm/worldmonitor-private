// api/toronto-311.js
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
var TODAY = /* @__PURE__ */ new Date();
var SEVEN_DAYS_AGO = new Date(TODAY.getTime() - 7 * 24 * 60 * 60 * 1e3);
var SEED_311_DATA = {
  city_stats: {
    total_requests: 1247,
    open_requests: 342,
    period_days: 7
  },
  ward_stress_scores: [
    { ward: "Etobicoke North", total_requests: 89, open_requests: 31, by_type: { "Shelter or Housing Crisis": 45, "Noise - Residential": 44 }, with_location: 76, avg_response_time_hours: "72.4", stress_score: 0.82, stress_level: "high" },
    { ward: "Scarborough-Rouge Park", total_requests: 78, open_requests: 28, by_type: { "Encampment Report": 52, "Noise - Residential": 26 }, with_location: 65, avg_response_time_hours: "68.2", stress_score: 0.76, stress_level: "high" },
    { ward: "York South-Weston", total_requests: 72, open_requests: 24, by_type: { "Shelter or Housing Crisis": 38, "Needle and Syringe Drop Box Full": 34 }, with_location: 61, avg_response_time_hours: "65.8", stress_score: 0.71, stress_level: "medium" },
    { ward: "Scarborough-Guildwood", total_requests: 65, open_requests: 19, by_type: { "Noise - Residential": 41, "Affordable Housing Request": 24 }, with_location: 55, avg_response_time_hours: "54.3", stress_score: 0.58, stress_level: "medium" },
    { ward: "North York-Steeles", total_requests: 58, open_requests: 16, by_type: { "Encampment Report": 35, "Noise - Residential": 23 }, with_location: 49, avg_response_time_hours: "48.9", stress_score: 0.51, stress_level: "medium" }
  ],
  top_wards: [],
  records: [
    { type: "Shelter or Housing Crisis", ward: "Etobicoke North", status: "Open", lat: 43.7234, lon: -79.6214, created_date: "2025-03-20T14:32:00" },
    { type: "Noise - Residential", ward: "Scarborough-Rouge Park", status: "Open", lat: 43.7842, lon: -79.1856, created_date: "2025-03-20T12:15:00" },
    { type: "Encampment Report", ward: "York South-Weston", status: "Open", lat: 43.6945, lon: -79.5178, created_date: "2025-03-20T10:45:00" },
    { type: "Affordable Housing Request", ward: "North York", status: "Open", lat: 43.7518, lon: -79.4123, created_date: "2025-03-19T16:22:00" },
    { type: "Needle and Syringe Drop Box Full", ward: "Etobicoke North", status: "Open", lat: 43.7089, lon: -79.5689, created_date: "2025-03-19T09:30:00" }
  ],
  fetched_at: TODAY.toISOString(),
  using_seed_data: true
};
var config = { runtime: "edge" };
async function handler(_req) {
  try {
    console.log("311 API: Using seed data (DataStore not available for 311 datasets)");
    return jsonResponse(SEED_311_DATA, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-if-error=7200",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("311 API error:", error);
    return jsonResponse({ ...SEED_311_DATA, error: error.message }, 200, {
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-if-error=1200",
      "Access-Control-Allow-Origin": "*"
    });
  }
}
export {
  config,
  handler as default
};
