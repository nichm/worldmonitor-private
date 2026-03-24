// api/schools.js
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
const DATASET_ID = "school-locations-all-types";
const GEOJSON_RESOURCE_ID = "02ef7447-54d9-4aa7-b76d-8ef8138ac546";
const DATA_URL = `${CKAN_BASE_URL}/datastore/dump/${GEOJSON_RESOURCE_ID}`;
const CACHE_KEY = "toronto-schools";
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
const config = { runtime: "edge" };
const SEED_SCHOOLS_DATA = `_id,NAME,ADDRESS,POSTAL_CODE,TYPE,LATITUDE,LONGITUDE
1,Earl Haig Secondary School,100 Princess Ave,M2N 3R1,Secondary,43.7721,-79.4152
2,Northern Secondary School,851 Mount Pleasant Rd,M4P 2L4,Secondary,43.7128,-79.3895
3, Jarvis Collegiate Institute,495 Jarvis St,M4Y 2G8,Secondary,43.6635,-79.3801
4,Central Technical School,725 Bathurst St,M5S 2R5,Secondary,43.6621,-79.4102
5,University of Toronto Schools,371 Bloor St W,M5S 1W6,Secondary,43.6689,-79.4012
6,Ursula Franklin Academy,90 Leland Ave,M6H 3L1,Secondary,43.6725,-79.4485
7,Western Technical-Commercial School,3300 Bloor St W,M9B 2X3,Secondary,43.6501,-79.5635
8,Marc Garneau Collegiate Institute,135 Don Mills Rd,M3C 1R9,Secondary,43.7328,-79.3315
9,William Lyon Mackenzie Collegiate Institute,20 Tillplain Rd,M3H 5R2,Secondary,43.7658,-79.4582
10,Agincourt Collegiate Institute,2621 Midland Ave,M1S 1V6,Secondary,43.7956,-79.2612
11,Earl Haig Junior School,15 Earl Haig Ave,M3C 1C3,Elementary,43.7189,-79.3756
12,North Toronto Collegiate Institute,70 Roehampton Ave,M4N 1S9,Secondary,43.7156,-79.3895
13,Leaside High School,200 Hanna Rd,M4G 3P8,Secondary,43.6889,-79.3815
14,Upper Canada College,200 Lonsdale Rd,M4V 2W6,Private,43.6985,-79.3895
15,Bishop Strachan School,298 Lonsdale Rd,M4V 1X2,Private,43.6988,-79.3875
16,St. Michael's College School,1515 Bathurst St,M5R 3C7,Private,43.6725,-79.4285
17,Crescent School,2365 Bayview Ave,M2L 1A2,Private,43.7456,-79.3856
18,Havergal College,1451 Avenue Rd,M5N 2H9,Private,43.7325,-79.4152
19,Brebeuf College School,70 St Mary St,M4S 1J9,Private,43.6789,-79.3985
20,Montessori Jewish Day School,18 Caledonia Park Rd,M4A 2K5,Private,43.7289,-79.3256`;
async function getFromRedis(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const resp = await fetch(`${url}/get/${key}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5e3)
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
      signal: AbortSignal.timeout(5e3)
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
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    const response = await fetch(DATA_URL, {
      headers: {
        "User-Agent": "worldmonitor.app"
      },
      signal: AbortSignal.timeout(2e4)
    });
    if (!response.ok) {
      throw new Error(`CKAN API returned ${response.status}: ${response.statusText}`);
    }
    const csv = await response.text();
    if (!csv || csv.trim().length === 0) {
      throw new Error("Empty CSV response from CKAN");
    }
    await setInRedis(CACHE_KEY, csv, CACHE_TTL_SECONDS);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Toronto Schools API error:", error);
    return new Response(SEED_SCHOOLS_DATA, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
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