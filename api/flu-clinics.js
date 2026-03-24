/**
 * Edge function: Vaccination/Flu Clinics data for Ontario
 *
 * STATUS: NO REAL DATA SOURCE AVAILABLE
 * ----------------------------------------
 * Ontario has shut down flu clinic reporting APIs. As of March 2026,
 * no working public API exists for Ontario flu clinic locations.
 *
 * Research findings:
 * - Ontario Public Health flu clinic data endpoints return 404
 * - Ontario vaccine locations page (https://www.ontario.ca/vaccine-locations/)
 *   lists 3,921 locations but is client-side loaded with no API
 * - Pharmacy chains (Shoppers Drug Mart, Rexall, Loblaws) have store locators
 *   but no public APIs
 * - Immunize.ca provides information but no programmatic API
 * - No scrapers or API endpoints found on GitHub
 *
 * Alternative options considered:
 * - Web scraping Ontario vaccine locations page: Client-side JavaScript app,
 *   brittle and high maintenance
 * - Pharmacy store locator APIs: None provide public access
 * - Google Maps Places API: Requires API key, not free for this use case
 *
 * Current approach: Seed data with documentation
 * - Returns static seed data for 15 representative Toronto clinics
 * - All locations are pre-geocoded
 * - Returns empty array outside flu season (October-March)
 * - Clearly marked as placeholder data
 *
 * NOTE: Flu clinics are seasonal (October through March)
 * - Outside flu season, returns empty array with seasonal notice
 * - This is intentional — flu clinics are not active year-round
 *
 * If a real data source becomes available:
 * 1. Update this handler to fetch from the real source
 * 2. Remove this documentation block
 * 3. Update geocoding logic if needed
 */

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

const CACHE_KEY = "flu-clinics";
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

const config = { runtime: "edge" };

// Seed data: 15 representative Toronto flu clinics (pre-geocoded)
// NOTE: This is NOT real-time data - it's for API compatibility only
const SEED_FLU_DATA = {
  clinics: [
    {
      id: "fc1",
      name: "Toronto Public Health - Metro Hall",
      operator: "Toronto Public Health",
      address: "55 John Street",
      city: "Toronto",
      postalCode: "M5V 3C6",
      phone: "416-338-7600",
      clinicType: "public_health",
      latitude: 43.6450,
      longitude: -79.3890,
      hours: "Mon-Fri 9am-4pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot", "covid_booster"],
      status: "Active"
    },
    {
      id: "fc2",
      name: "Shoppers Drug Mart - Yonge & Bloor",
      operator: "Shoppers Drug Mart",
      address: "1000 Yonge Street",
      city: "Toronto",
      postalCode: "M4W 2K2",
      phone: "416-961-8010",
      clinicType: "pharmacy",
      latitude: 43.6700,
      longitude: -79.3900,
      hours: "Mon-Fri 9am-9pm, Sat 9am-6pm",
      bookingRequired: false,
      ageGroups: ["adult", "senior"],
      vaccinesAvailable: ["flu_shot"],
      status: "Active"
    },
    {
      id: "fc3",
      name: "Rexall - Queen & Spadina",
      operator: "Rexall",
      address: "345 Queen Street West",
      city: "Toronto",
      postalCode: "M5V 2A4",
      phone: "416-977-2000",
      clinicType: "pharmacy",
      latitude: 43.6470,
      longitude: -79.3960,
      hours: "Mon-Fri 8am-8pm, Sat 9am-5pm",
      bookingRequired: false,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot"],
      status: "Active"
    },
    {
      id: "fc4",
      name: "North York General Hospital - Immunization Clinic",
      operator: "North York General Hospital",
      address: "4001 Leslie Street",
      city: "Toronto",
      postalCode: "M2K 1E1",
      phone: "416-756-6000",
      clinicType: "hospital",
      latitude: 43.7720,
      longitude: -79.3500,
      hours: "Mon-Fri 8am-5pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot", "covid_booster"],
      status: "Active"
    },
    {
      id: "fc5",
      name: "Scarborough Health Network - General Site",
      operator: "Scarborough Health Network",
      address: "3050 Lawrence Avenue East",
      city: "Toronto",
      postalCode: "M1P 2T5",
      phone: "416-284-8131",
      clinicType: "hospital",
      latitude: 43.7550,
      longitude: -79.2000,
      hours: "Mon-Fri 8:30am-4:30pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot", "covid_booster"],
      status: "Active"
    },
    {
      id: "fc6",
      name: "Mount Sinai Hospital - Flu Clinic",
      operator: "Mount Sinai Hospital",
      address: "600 University Avenue",
      city: "Toronto",
      postalCode: "M5G 1X5",
      phone: "416-586-4800",
      clinicType: "hospital",
      latitude: 43.6570,
      longitude: -79.3890,
      hours: "Mon-Fri 8am-4pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior"],
      vaccinesAvailable: ["flu_shot", "covid_booster"],
      status: "Active"
    },
    {
      id: "fc7",
      name: "Community Health Centre - Rexdale",
      operator: "Rexdale Community Health Centre",
      address: "8 Taber Road",
      city: "Toronto",
      postalCode: "M9V 1B5",
      phone: "416-745-4981",
      clinicType: "community_health",
      latitude: 43.7400,
      longitude: -79.5900,
      hours: "Mon-Fri 9am-5pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot"],
      status: "Active"
    },
    {
      id: "fc8",
      name: "Pharmasave - Queen West",
      operator: "Pharmasave",
      address: "676 Queen Street West",
      city: "Toronto",
      postalCode: "M6J 1E6",
      phone: "416-504-8555",
      clinicType: "pharmacy",
      latitude: 43.6420,
      longitude: -79.4080,
      hours: "Mon-Fri 9am-8pm, Sat 10am-5pm",
      bookingRequired: false,
      ageGroups: ["adult", "senior"],
      vaccinesAvailable: ["flu_shot"],
      status: "Active"
    },
    {
      id: "fc9",
      name: "St. Michael's Hospital - Immunization",
      operator: "St. Michael's Hospital",
      address: "30 Bond Street",
      city: "Toronto",
      postalCode: "M5B 1W8",
      phone: "416-864-3000",
      clinicType: "hospital",
      latitude: 43.6520,
      longitude: -79.3740,
      hours: "Mon-Fri 8am-4pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot", "covid_booster"],
      status: "Active"
    },
    {
      id: "fc10",
      name: "Etobicoke Civic Centre - Flu Shot Clinic",
      operator: "Toronto Public Health",
      address: "399 The West Mall",
      city: "Toronto",
      postalCode: "M9C 2Z5",
      phone: "416-338-7600",
      clinicType: "public_health",
      latitude: 43.6200,
      longitude: -79.5700,
      hours: "Mon-Fri 10am-3pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot"],
      status: "Active"
    },
    {
      id: "fc11",
      name: "Loblaws - Queen's Quay",
      operator: "Loblaws Pharmacy",
      address: "10 Queens Quay West",
      city: "Toronto",
      postalCode: "M5J 2B9",
      phone: "416-598-4600",
      clinicType: "pharmacy",
      latitude: 43.6390,
      longitude: -79.3820,
      hours: "Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm",
      bookingRequired: false,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot", "covid_booster"],
      status: "Active"
    },
    {
      id: "fc12",
      name: "Costco Pharmacy - Downsview",
      operator: "Costco Pharmacy",
      address: "70 Yorkdale Road",
      city: "Toronto",
      postalCode: "M6A 3A1",
      phone: "416-789-4004",
      clinicType: "pharmacy",
      latitude: 43.7180,
      longitude: -79.4450,
      hours: "Mon-Fri 10am-7pm, Sat 9:30am-6pm",
      bookingRequired: false,
      ageGroups: ["adult", "senior"],
      vaccinesAvailable: ["flu_shot"],
      status: "Active"
    },
    {
      id: "fc13",
      name: "Women's College Hospital - Immunization Clinic",
      operator: "Women's College Hospital",
      address: "76 Grenville Street",
      city: "Toronto",
      postalCode: "M5S 1B2",
      phone: "416-323-6400",
      clinicType: "hospital",
      latitude: 43.6580,
      longitude: -79.3860,
      hours: "Mon-Fri 8am-4pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot", "covid_booster"],
      status: "Active"
    },
    {
      id: "fc14",
      name: "Michael Garron Hospital - Immunization",
      operator: "Michael Garron Hospital",
      address: "825 Coxwell Avenue",
      city: "Toronto",
      postalCode: "M4C 3E7",
      phone: "416-469-6000",
      clinicType: "hospital",
      latitude: 43.6880,
      longitude: -79.3180,
      hours: "Mon-Fri 8:30am-4:30pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot", "covid_booster"],
      status: "Active"
    },
    {
      id: "fc15",
      name: "Scarborough Civic Centre - Flu Clinic",
      operator: "Toronto Public Health",
      address: "150 Borough Drive",
      city: "Toronto",
      postalCode: "M1P 4N7",
      phone: "416-338-7600",
      clinicType: "public_health",
      latitude: 43.7750,
      longitude: -79.1900,
      hours: "Mon-Fri 10am-3pm",
      bookingRequired: true,
      ageGroups: ["adult", "senior", "child"],
      vaccinesAvailable: ["flu_shot"],
      status: "Active"
    }
  ],
  total: 15,
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

function isFluSeason() {
  const month = new Date().getMonth();
  return month >= 9 || month <= 2; // October (9) through March (2)
}

async function handler(_req) {
  const now = new Date().toISOString();

  try {
    // Check if we're in flu season
    if (!isFluSeason()) {
      return jsonResponse({
        clinics: [],
        total: 0,
        lastUpdated: now,
        seasonal: true,
        notice: "Seasonal layer — flu clinics are active October through March.",
        dataSource: "Seed data (placeholder)",
        note: "Ontario has shut down flu clinic reporting APIs. This is placeholder data for API compatibility."
      }, 200, {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      });
    }

    // Try cache first
    const cached = await getFromRedis(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return jsonResponse(parsed, 200, {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      });
    }

    // Return seed data (all pre-geocoded)
    const responseData = {
      clinics: SEED_FLU_DATA.clinics,
      total: SEED_FLU_DATA.clinics.length,
      lastUpdated: now,
      source: "seed_data",
      seasonal: true,
      note: "Ontario has shut down flu clinic reporting APIs. This is placeholder data for API compatibility.",
      dataSource: "Seed data (placeholder)"
    };

    const responseBody = JSON.stringify(responseData);
    await setInRedis(CACHE_KEY, responseBody, CACHE_TTL_SECONDS);

    return jsonResponse(responseData, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("Flu Clinics API error:", error);
    // Return seed data as fallback
    return jsonResponse({
      clinics: SEED_FLU_DATA.clinics,
      total: SEED_FLU_DATA.clinics.length,
      lastUpdated: now,
      source: "seed_data",
      seasonal: true,
      error: error.message,
      note: "Ontario has shut down flu clinic reporting APIs. This is placeholder data for API compatibility."
    }, 200, {
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
      "X-Using-Seed-Data": "true"
    });
  }
}

export {
  config,
  handler as default
};