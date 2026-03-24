// api/ev-charging.js
// Edge function for EV Charging Stations data from NREL API
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

const NREL_API_BASE = "https://developer.nrel.gov/api/alt-fuel-stations/v1.json";
const CACHE_KEY = "ev-charging-stations";
const CACHE_TTL_SECONDS = 12 * 60 * 60; // 12 hours

const config = { runtime: "edge" };

// Seed data for fallback when API fails
const SEED_EV_DATA = {
  stations: [
    {
      id: "1",
      station_name: "EVGO - 100 Queen Street West",
      street_address: "100 Queen Street West",
      city: "Toronto",
      state: "ON",
      zip: "M5H 2N2",
      latitude: 43.6532,
      longitude: -79.3832,
      station_phone: "1-877-494-3833",
      status: "E",
      access_days_time: "24 hours daily",
      groups_with_access_code: "Public",
      cards_accepted: "EVGO Membership",
      ev_level1_evse_num: 0,
      ev_level2_evse_num: 2,
      ev_dc_fast_count: 2,
      ev_other_evse: 0,
      ev_network: "EVgo",
      ev_network_web: "https://www.evgo.com",
      geocode_status: "GPS",
      latitude_input: 43.6532,
      longitude_input: -79.3832,
      id_input: "1",
      updated_at: "2026-03-24"
    },
    {
      id: "2",
      station_name: "ChargePoint - Eaton Centre",
      street_address: "220 Yonge Street",
      city: "Toronto",
      state: "ON",
      zip: "M5B 2H1",
      latitude: 43.6542,
      longitude: -79.3807,
      station_phone: "1-833-236-4858",
      status: "E",
      access_days_time: "24 hours daily",
      groups_with_access_code: "Public",
      cards_accepted: "ChargePoint",
      ev_level1_evse_num: 0,
      ev_level2_evse_num: 8,
      ev_dc_fast_count: 0,
      ev_other_evse: 0,
      ev_network: "ChargePoint Network",
      ev_network_web: "https://www.chargepoint.com",
      geocode_status: "GPS",
      latitude_input: 43.6542,
      longitude_input: -79.3807,
      id_input: "2",
      updated_at: "2026-03-24"
    },
    {
      id: "3",
      station_name: "FLO - Union Station",
      street_address: "65 Front Street West",
      city: "Toronto",
      state: "ON",
      zip: "M5J 1E6",
      latitude: 43.6450,
      longitude: -79.3800,
      station_phone: "1-855-999-3566",
      status: "E",
      access_days_time: "24 hours daily",
      groups_with_access_code: "Public",
      cards_accepted: "FLO",
      ev_level1_evse_num: 0,
      ev_level2_evse_num: 4,
      ev_dc_fast_count: 0,
      ev_other_evse: 0,
      ev_network: "FLO",
      ev_network_web: "https://www.flo.ca",
      geocode_status: "GPS",
      latitude_input: 43.6450,
      longitude_input: -79.3800,
      id_input: "3",
      updated_at: "2026-03-24"
    },
    {
      id: "4",
      station_name: "Tesla Supercharger - Sherway Gardens",
      street_address: "25 The West Mall",
      city: "Toronto",
      state: "ON",
      zip: "M9C 1B8",
      latitude: 43.6150,
      longitude: -79.5600,
      station_phone: "1-877-798-3752",
      status: "E",
      access_days_time: "24 hours daily",
      groups_with_access_code: "Tesla",
      cards_accepted: "Tesla",
      ev_level1_evse_num: 0,
      ev_level2_evse_num: 0,
      ev_dc_fast_count: 12,
      ev_other_evse: 0,
      ev_network: "Tesla",
      ev_network_web: "https://www.tesla.com/supercharger",
      geocode_status: "GPS",
      latitude_input: 43.6150,
      longitude_input: -79.5600,
      id_input: "4",
      updated_at: "2026-03-24"
    },
    {
      id: "5",
      station_name: "Petro-Canada - 1001 Yonge Street",
      street_address: "1001 Yonge Street",
      city: "Toronto",
      state: "ON",
      zip: "M4W 2K6",
      latitude: 43.6700,
      longitude: -79.3900,
      station_phone: "1-800-668-0228",
      status: "E",
      access_days_time: "24 hours daily",
      groups_with_access_code: "Public",
      cards_accepted: "Petro-Canada",
      ev_level1_evse_num: 0,
      ev_level2_evse_num: 0,
      ev_dc_fast_count: 4,
      ev_other_evse: 0,
      ev_network: "Petro-Canada",
      ev_network_web: "https://www.petro-canada.ca",
      geocode_status: "GPS",
      latitude_input: 43.6700,
      longitude_input: -79.3900,
      id_input: "5",
      updated_at: "2026-03-24"
    }
  ],
  total: 5,
  source: "seed_data"
};

async function getFromRedis(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const resp = await fetch(`${url}/get/${key}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.result;
  } catch {
    return null;
  }
}

async function setInRedis(key, value, ttlSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const pipeline = [
      ["SET", key, value],
      ["EXPIRE", key, ttlSeconds]
    ];
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(5000)
    });
    return resp.ok;
  } catch {
    return false;
  }
}

async function handler(_req) {
  try {
    const cached = await getFromRedis(CACHE_KEY);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Get API key from environment or use demo key
    const apiKey = process.env.NREL_API_KEY || "DEMO_KEY";

    // Fetch from NREL API - get Ontario EV stations
    const apiUrl = `${NREL_API_BASE}?api_key=${apiKey}&fuel=ELEC&state=ON&limit=all&output=geojson`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "worldmonitor.app"
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      throw new Error(`NREL API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // NREL returns GeoJSON format when output=geojson
    let stations = [];

    if (data && data.features && Array.isArray(data.features)) {
      // GeoJSON format - convert to our format
      stations = data.features.map(feature => ({
        id: feature.properties.id || `ev-${feature.properties.station_id}`,
        station_name: feature.properties.station_name || "",
        street_address: feature.properties.street_address || "",
        city: feature.properties.city || "",
        state: feature.properties.state || "",
        zip: feature.properties.zip || "",
        latitude: feature.geometry?.coordinates?.[1] || 0,
        longitude: feature.geometry?.coordinates?.[0] || 0,
        station_phone: feature.properties.station_phone || "",
        status: feature.properties.status || "",
        access_days_time: feature.properties.access_days_time || "",
        groups_with_access_code: feature.properties.groups_with_access_code || "",
        cards_accepted: feature.properties.cards_accepted || "",
        ev_level1_evse_num: feature.properties.ev_level1_evse_num || 0,
        ev_level2_evse_num: feature.properties.ev_level2_evse_num || 0,
        ev_dc_fast_count: feature.properties.ev_dc_fast_count || 0,
        ev_other_evse: feature.properties.ev_other_evse || 0,
        ev_network: feature.properties.ev_network || "",
        ev_network_web: feature.properties.ev_network_web || "",
        geocode_status: feature.properties.geocode_status || "",
        latitude_input: feature.properties.latitude_input || 0,
        longitude_input: feature.properties.longitude_input || 0,
        id_input: feature.properties.id_input || "",
        updated_at: feature.properties.updated_at || ""
      }));
    } else if (data && Array.isArray(data.fuel_stations)) {
      // Standard JSON format
      stations = data.fuel_stations;
    } else if (data && Array.isArray(data)) {
      // Direct array format
      stations = data;
    }

    if (!stations || stations.length === 0) {
      throw new Error("No stations data in NREL response");
    }

    const responseData = {
      stations,
      total: stations.length,
      source: "nrel_api"
    };

    const responseBody = JSON.stringify(responseData);
    await setInRedis(CACHE_KEY, responseBody, CACHE_TTL_SECONDS);

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("EV Charging API error:", error);
    // Return seed data as fallback
    return new Response(JSON.stringify(SEED_EV_DATA), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Access-Control-Allow-Origin": "*",
        "X-Using-Seed-Data": "true"
      }
    });
  }
}

export {
  config,
  handler as default
};