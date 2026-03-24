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
const SEED_SCHOOLS_DATA = `_id,NAME,SCHOOL_LEVEL,SCHOOL_TYPE,BOARD_NAME,ADDRESS_FULL,geometry
1,Earl Haig Secondary School,Secondary,Academic,Toronto District School Board,"100 Princess Ave, Toronto",{"type":"Point","coordinates":[-79.4152,43.7721]}
2,Northern Secondary School,Secondary,Academic,Toronto District School Board,"851 Mount Pleasant Rd, Toronto",{"type":"Point","coordinates":[-79.3895,43.7128]}
3,Jarvis Collegiate Institute,Secondary,Academic,Toronto District School Board,"495 Jarvis St, Toronto",{"type":"Point","coordinates":[-79.3801,43.6635]}
4,Central Technical School,Secondary,Academic,Toronto District School Board,"725 Bathurst St, Toronto",{"type":"Point","coordinates":[-79.4102,43.6621]}
5,University of Toronto Schools,Secondary,Academic,University of Toronto,"371 Bloor St W, Toronto",{"type":"Point","coordinates":[-79.4012,43.6689]}
6,Ursula Franklin Academy,Secondary,Academic,Toronto District School Board,"90 Leland Ave, Toronto",{"type":"Point","coordinates":[-79.4485,43.6725]}
7,Western Technical-Commercial School,Secondary,Academic,Toronto District School Board,"3300 Bloor St W, Toronto",{"type":"Point","coordinates":[-79.5635,43.6501]}
8,Marc Garneau Collegiate Institute,Secondary,Academic,Toronto District School Board,"135 Don Mills Rd, Toronto",{"type":"Point","coordinates":[-79.3315,43.7328]}
9,William Lyon Mackenzie Collegiate Institute,Secondary,Academic,Toronto District School Board,"20 Tillplain Rd, Toronto",{"type":"Point","coordinates":[-79.4582,43.7658]}
10,Agincourt Collegiate Institute,Secondary,Academic,Toronto District School Board,"2621 Midland Ave, Toronto",{"type":"Point","coordinates":[-79.2612,43.7956]}
11,Earl Haig Junior School,Elementary,Academic,Toronto District School Board,"15 Earl Haig Ave, Toronto",{"type":"Point","coordinates":[-79.3756,43.7189]}
12,North Toronto Collegiate Institute,Secondary,Academic,Toronto District School Board,"70 Roehampton Ave, Toronto",{"type":"Point","coordinates":[-79.3895,43.7156]}
13,Leaside High School,Secondary,Academic,Toronto District School Board,"200 Hanna Rd, Toronto",{"type":"Point","coordinates":[-79.3815,43.6889]}
14,Upper Canada College,Secondary,Private,Independent,"200 Lonsdale Rd, Toronto",{"type":"Point","coordinates":[-79.3895,43.6985]}
15,Bishop Strachan School,Elementary,Private,Independent,"298 Lonsdale Rd, Toronto",{"type":"Point","coordinates":[-79.3875,43.6988]}
16,St. Michael's College School,Secondary,Private,Catholic,"1515 Bathurst St, Toronto",{"type":"Point","coordinates":[-79.4285,43.6725]}
17,Crescent School,Elementary,Private,Independent,"2365 Bayview Ave, Toronto",{"type":"Point","coordinates":[-79.3856,43.7456]}
18,Havergal College,Elementary,Private,Independent,"1451 Avenue Rd, Toronto",{"type":"Point","coordinates":[-79.4152,43.7325]}
19,Brebeuf College School,Secondary,Private,Catholic,"70 St Mary St, Toronto",{"type":"Point","coordinates":[-79.3985,43.6789]}
20,Montessori Jewish Day School,Elementary,Private,Independent,"18 Caledonia Park Rd, Toronto",{"type":"Point","coordinates":[-79.3256,43.7289]}`;
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