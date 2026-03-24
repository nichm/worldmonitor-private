// api/green-roof-permits.js
// Edge function for Green Roof Construction Permits data from Toronto Open Data
// Source: CKAN datastore

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

const CACHE_KEY = "green-roof-permits";
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const config = { runtime: "edge" };

// Seed data with pre-geocoded Toronto green roof permits
const SEED_GREEN_ROOF_DATA = {
  permits: [
    {
      id: "grp1",
      permitNumber: "2024-GR-001",
      address: "100 Queen Street West",
      city: "Toronto",
      postalCode: "M5H 2N2",
      ward: "Toronto Centre",
      latitude: 43.6532,
      longitude: -79.3832,
      permitType: "voluntary",
      greenRoofArea: 2500,
      buildingType: "commercial",
      applicant: "ABC Development Corp",
      issueDate: "2024-01-15",
      year: 2024,
      status: "Approved"
    },
    {
      id: "grp2",
      permitNumber: "2023-GR-042",
      address: "500 University Avenue",
      city: "Toronto",
      postalCode: "M5G 1V8",
      ward: "University-Rosedale",
      latitude: 43.6570,
      longitude: -79.3950,
      permitType: "bylaw",
      greenRoofArea: 1800,
      buildingType: "residential",
      applicant: "Toronto Housing Corp",
      issueDate: "2023-06-20",
      year: 2023,
      status: "Approved"
    },
    {
      id: "grp3",
      permitNumber: "2024-GR-015",
      address: "5255 Yonge Street",
      city: "Toronto",
      postalCode: "M2N 6L5",
      ward: "Willowdale",
      latitude: 43.7680,
      longitude: -79.4100,
      permitType: "voluntary",
      greenRoofArea: 3200,
      buildingType: "commercial",
      applicant: "North York Centre LLC",
      issueDate: "2024-03-10",
      year: 2024,
      status: "Approved"
    },
    {
      id: "grp4",
      permitNumber: "2022-GR-088",
      address: "1 Blue Jays Way",
      city: "Toronto",
      postalCode: "M5V 1J1",
      ward: "Spadina-Fort York",
      latitude: 43.6420,
      longitude: -79.3890,
      permitType: "bylaw",
      greenRoofArea: 4500,
      buildingType: "mixed-use",
      applicant: "CityPlace Development",
      issueDate: "2022-09-01",
      year: 2022,
      status: "Approved"
    },
    {
      id: "grp5",
      permitNumber: "2024-GR-028",
      address: "2150 Lakeshore Boulevard West",
      city: "Toronto",
      postalCode: "M8V 4A4",
      ward: "Etobicoke-Lakeshore",
      latitude: 43.6150,
      longitude: -79.5250,
      permitType: "voluntary",
      greenRoofArea: 1200,
      buildingType: "residential",
      applicant: "Lakeshore Properties",
      issueDate: "2024-05-05",
      year: 2024,
      status: "Approved"
    },
    {
      id: "grp6",
      permitNumber: "2023-GR-056",
      address: "25 The Esplanade",
      city: "Toronto",
      postalCode: "M5A 4A9",
      ward: "Toronto Centre",
      latitude: 43.6500,
      longitude: -79.3660,
      permitType: "bylaw",
      greenRoofArea: 950,
      buildingType: "commercial",
      applicant: "St. Lawrence Properties",
      issueDate: "2023-04-15",
      year: 2023,
      status: "Approved"
    },
    {
      id: "grp7",
      permitNumber: "2021-GR-102",
      address: "100 King Street West",
      city: "Toronto",
      postalCode: "M5X 1C4",
      ward: "Toronto Centre",
      latitude: 43.6480,
      longitude: -79.3810,
      permitType: "bylaw",
      greenRoofArea: 2800,
      buildingType: "commercial",
      applicant: "Financial District Tower",
      issueDate: "2021-11-20",
      year: 2021,
      status: "Approved"
    },
    {
      id: "grp8",
      permitNumber: "2024-GR-035",
      address: "1200 Markham Road",
      city: "Toronto",
      postalCode: "M1J 3G3",
      ward: "Scarborough North",
      latitude: 43.7750,
      longitude: -79.2000,
      permitType: "voluntary",
      greenRoofArea: 850,
      buildingType: "residential",
      applicant: "Scarborough Heights",
      issueDate: "2024-02-28",
      year: 2024,
      status: "Approved"
    },
    {
      id: "grp9",
      permitNumber: "2022-GR-075",
      address: "777 Bay Street",
      city: "Toronto",
      postalCode: "M5G 2C8",
      ward: "University-Rosedale",
      latitude: 43.6600,
      longitude: -79.3840,
      permitType: "bylaw",
      greenRoofArea: 2100,
      buildingType: "commercial",
      applicant: "Atrium on Bay",
      issueDate: "2022-07-10",
      year: 2022,
      status: "Approved"
    },
    {
      id: "grp10",
      permitNumber: "2024-GR-042",
      address: "300 Bloor Street West",
      city: "Toronto",
      postalCode: "M5S 1W3",
      ward: "University-Rosedale",
      latitude: 43.6690,
      longitude: -79.4000,
      permitType: "voluntary",
      greenRoofArea: 1600,
      buildingType: "educational",
      applicant: "University of Toronto",
      issueDate: "2024-04-20",
      year: 2024,
      status: "Approved"
    },
    {
      id: "grp11",
      permitNumber: "2020-GR-120",
      address: "33 Harbour Square",
      city: "Toronto",
      postalCode: "M5J 2G2",
      ward: "Spadina-Fort York",
      latitude: 43.6410,
      longitude: -79.3790,
      permitType: "bylaw",
      greenRoofArea: 3800,
      buildingType: "residential",
      applicant: "Harbourfront Condos",
      issueDate: "2020-08-15",
      year: 2020,
      status: "Approved"
    },
    {
      id: "grp12",
      permitNumber: "2023-GR-062",
      address: "600 Sheppard Avenue East",
      city: "Toronto",
      postalCode: "M2N 1H5",
      ward: "Willowdale",
      latitude: 43.7700,
      longitude: -79.4150,
      permitType: "bylaw",
      greenRoofArea: 1400,
      buildingType: "residential",
      applicant: "Sheppard-York Development",
      issueDate: "2023-10-05",
      year: 2023,
      status: "Approved"
    }
  ],
  total: 12,
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

async function geocodeAddress(address) {
  try {
    const url = `/api/toronto-geocode?address=${encodeURIComponent(address)}`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.lat && data.lon) {
      return { lat: data.lat, lon: data.lon };
    }
    return null;
  } catch {
    return null;
  }
}

async function handler(_req) {
  const now = new Date().toISOString();

  try {
    // Try cache first
    const cached = await getFromRedis(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return jsonResponse(parsed, 200, {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      });
    }

    // TODO: Integrate with Toronto Open Data green roof permits
    // Source: https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=green-roof-construction-permits
    // Need to fetch CKAN data, parse, filter for Toronto, and geocode addresses.

    // Return seed data (all pre-geocoded)
    const responseData = {
      permits: SEED_GREEN_ROOF_DATA.permits,
      total: SEED_GREEN_ROOF_DATA.permits.length,
      lastUpdated: now,
      source: "seed_data"
    };

    const responseBody = JSON.stringify(responseData);
    await setInRedis(CACHE_KEY, responseBody, CACHE_TTL_SECONDS);

    return jsonResponse(responseData, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("Green Roof Permits API error:", error);
    // Return seed data as fallback
    return jsonResponse({
      permits: SEED_GREEN_ROOF_DATA.permits,
      total: SEED_GREEN_ROOF_DATA.permits.length,
      lastUpdated: now,
      source: "seed_data",
      error: error.message
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