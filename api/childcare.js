// api/childcare.js
// Edge function for Licensed Childcare Centres data from Ontario Ministry of Education
// Uses seed data with pre-geocoded Toronto addresses for reliability

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

const CACHE_KEY = "childcare-centres";
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

const config = { runtime: "edge" };

// Seed data with pre-geocoded Toronto childcare centres
const SEED_CHILDCARE_DATA = {
  centres: [
    {
      id: "cc1",
      name: "Toronto Early Learning Centre",
      operator: "Toronto District School Board",
      licenceNumber: "123456",
      address: "5050 Yonge Street",
      city: "Toronto",
      postalCode: "M2N 5N5",
      phone: "416-395-2000",
      capacity: 80,
      ageGroup: "preschool",
      latitude: 43.7615,
      longitude: -79.4111,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc2",
      name: "Downtown Childcare Centre",
      operator: "YMCA of Greater Toronto",
      licenceNumber: "234567",
      address: "20 Grosvenor Street",
      city: "Toronto",
      postalCode: "M4Y 2V4",
      phone: "416-928-9622",
      capacity: 60,
      ageGroup: "toddler",
      latitude: 43.6700,
      longitude: -79.3820,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc3",
      name: "Little Explorers Daycare",
      operator: "Private Operator",
      licenceNumber: "345678",
      address: "100 Queen Street West",
      city: "Toronto",
      postalCode: "M5H 2N2",
      phone: "416-555-0100",
      capacity: 45,
      ageGroup: "infant",
      latitude: 43.6532,
      longitude: -79.3832,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc4",
      name: "Rosedale Nursery School",
      operator: "Private Operator",
      licenceNumber: "456789",
      address: "663 South Drive",
      city: "Toronto",
      postalCode: "M4W 1H4",
      phone: "416-555-0200",
      capacity: 30,
      ageGroup: "preschool",
      latitude: 43.6810,
      longitude: -79.3750,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc5",
      name: "Scarlett Heights Academy",
      operator: "Private Operator",
      licenceNumber: "567890",
      address: "15 Tobermory Drive",
      city: "Toronto",
      postalCode: "M9V 1B6",
      phone: "416-555-0300",
      capacity: 65,
      ageGroup: "kindergarten",
      latitude: 43.7560,
      longitude: -79.5650,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc6",
      name: "Etobicoke Children's Centre",
      operator: "Toronto Children's Services",
      licenceNumber: "678901",
      address: "500 The West Mall",
      city: "Toronto",
      postalCode: "M9C 1B8",
      phone: "416-338-1516",
      capacity: 90,
      ageGroup: "preschool",
      latitude: 43.6150,
      longitude: -79.5600,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc7",
      name: "North York Infant Care",
      operator: "Private Operator",
      licenceNumber: "789012",
      address: "5120 Yonge Street",
      city: "Toronto",
      postalCode: "M2N 5N6",
      phone: "416-555-0400",
      capacity: 25,
      ageGroup: "infant",
      latitude: 43.7680,
      longitude: -79.4100,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc8",
      name: "East York Toddler Program",
      operator: "Toronto District School Board",
      licenceNumber: "890123",
      address: "870 Coxwell Avenue",
      city: "Toronto",
      postalCode: "M4C 4R2",
      phone: "416-555-0500",
      capacity: 40,
      ageGroup: "toddler",
      latitude: 43.6850,
      longitude: -79.3200,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc9",
      name: "Liberty Village Early Learning",
      operator: "YMCA of Greater Toronto",
      licenceNumber: "901234",
      address: "100 East Liberty Street",
      city: "Toronto",
      postalCode: "M6K 3S3",
      phone: "416-555-0600",
      capacity: 70,
      ageGroup: "preschool",
      latitude: 43.6370,
      longitude: -79.4180,
      status: "Active",
      licenceExpiry: "2026-12-31"
    },
    {
      id: "cc10",
      name: "Thornhill Kindergarten Club",
      operator: "Private Operator",
      licenceNumber: "012345",
      address: "300 John Street",
      city: "Toronto",
      postalCode: "M3H 2C2",
      phone: "416-555-0700",
      capacity: 55,
      ageGroup: "kindergarten",
      latitude: 43.7850,
      longitude: -79.4250,
      status: "Active",
      licenceExpiry: "2026-12-31"
    }
  ],
  total: 10,
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

    // TODO: Integrate with Ontario Ministry of Education data
    // Source: https://data.ontario.ca/dataset/child-care-licensing-inspection-and-enforcement-data
    // The XLSX file is large and requires complex parsing. For now, use seed data.

    // Return seed data (all pre-geocoded)
    const responseData = {
      centres: SEED_CHILDCARE_DATA.centres,
      total: SEED_CHILDCARE_DATA.centres.length,
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
    console.error("Childcare API error:", error);
    // Return seed data as fallback
    return jsonResponse({
      centres: SEED_CHILDCARE_DATA.centres,
      total: SEED_CHILDCARE_DATA.centres.length,
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