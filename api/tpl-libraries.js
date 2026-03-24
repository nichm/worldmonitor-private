// api/tpl-libraries.js
// Edge function for Toronto Public Library Branches data
// Source: https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/f5aa9b07-da35-45e6-b31f-d6790eb9bd9b/resource/0a48b601-9a07-4de6-ae73-b955527b3e70/download/tpl-branch-general-information-2023.json

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

const CACHE_KEY = "tpl-libraries";
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const config = { runtime: "edge" };

// Seed data with pre-geocoded Toronto Public Library branches
const SEED_TPL_DATA = {
  branches: [
    {
      id: "tpl1",
      name: "Toronto Reference Library",
      address: "789 Yonge Street",
      city: "Toronto",
      postalCode: "M4W 2G8",
      branchType: "research",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-393-7131",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=TRL25",
      latitude: 43.6720,
      longitude: -79.3840,
      features: ["wifi", "computers", "meeting_rooms", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl2",
      name: "North York Central Library",
      address: "5120 Yonge Street",
      city: "Toronto",
      postalCode: "M2N 5N9",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-395-5535",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=NYC60",
      latitude: 43.7680,
      longitude: -79.4100,
      features: ["wifi", "computers", "meeting_rooms", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl3",
      name: "Scarborough Civic Centre Library",
      address: "150 Borough Drive",
      city: "Toronto",
      postalCode: "M1P 4N7",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-396-8890",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=SCC60",
      latitude: 43.7750,
      longitude: -79.1900,
      features: ["wifi", "computers", "meeting_rooms", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl4",
      name: "Etobicoke Civic Centre Library",
      address: "399 The West Mall",
      city: "Toronto",
      postalCode: "M9C 2Z5",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-394-5240",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=ECC50",
      latitude: 43.6200,
      longitude: -79.5700,
      features: ["wifi", "computers", "meeting_rooms", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl5",
      name: "Yorkville Library",
      address: "22 Yorkville Avenue",
      city: "Toronto",
      postalCode: "M4W 1L4",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun closed",
      phone: "416-393-7660",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=YOR66",
      latitude: 43.6700,
      longitude: -79.3930,
      features: ["wifi", "computers", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl6",
      name: "Lillian H. Smith Library",
      address: "239 College Street",
      city: "Toronto",
      postalCode: "M5T 1R5",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-393-7746",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=LHS61",
      latitude: 43.6570,
      longitude: -79.3940,
      features: ["wifi", "computers", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl7",
      name: "Beaches Library",
      address: "2161 Queen Street East",
      city: "Toronto",
      postalCode: "M4E 1G3",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-393-7703",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=BEA61",
      latitude: 43.6740,
      longitude: -79.2950,
      features: ["wifi", "computers", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl8",
      name: "Annette Street Library",
      address: "145 Annette Street",
      city: "Toronto",
      postalCode: "M6H 4E7",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-393-7692",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=ANN63",
      latitude: 43.6520,
      longitude: -79.4730,
      features: ["wifi", "computers", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl9",
      name: "Bloor/Gladstone Library",
      address: "1101 Bloor Street West",
      city: "Toronto",
      postalCode: "M6H 1M1",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-393-7674",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=BLG62",
      latitude: 43.6550,
      longitude: -79.4320,
      features: ["wifi", "computers", "meeting_rooms", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl10",
      name: "Runnymede Library",
      address: "2178 Bloor Street West",
      city: "Toronto",
      postalCode: "M6S 1R5",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-393-7697",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=RUN62",
      latitude: 43.6580,
      longitude: -79.4770,
      features: ["wifi", "computers", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl11",
      name: "Barbara Frum Library",
      address: "20 Covington Road",
      city: "Toronto",
      postalCode: "M5A 1A3",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-393-7650",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=BFU62",
      latitude: 43.7280,
      longitude: -79.3980,
      features: ["wifi", "computers", "meeting_rooms", "accessibility"],
      status: "Active"
    },
    {
      id: "tpl12",
      name: "Mount Pleasant Library",
      address: "599 Mount Pleasant Road",
      city: "Toronto",
      postalCode: "M4S 2M5",
      branchType: "branch",
      hours: "Mon-Thu 9am-8:30pm, Fri-Sat 9am-5pm, Sun 1:30pm-5pm",
      phone: "416-393-7683",
      website: "https://www.torontopubliclibrary.ca/detail.jsp?R=MPL63",
      latitude: 43.7000,
      longitude: -79.3900,
      features: ["wifi", "computers", "accessibility"],
      status: "Active"
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

// Simple string hash for caching geocoding results
function addressHash(addr) {
  var hash = 0;
  for (var i = 0; i < addr.length; i++) {
    var char = addr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
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

    // Fetch from CKAN — Toronto Public Library branch data (JSON with addresses)
    var TPL_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/f5aa9b07-da35-45e6-b31f-d6790eb9bd9b/resource/0a48b601-9a07-4de6-ae73-b955527b3e70/download/tpl-branch-general-information-2023.json";

    var res = await fetch(TPL_URL);
    var rawBranches = [];
    if (res.ok) {
      var json = await res.json();
      rawBranches = Array.isArray(json) ? json : [];
    }

    // Geocode each branch address via Nominatim (rate-limited with caching)
    var GEOCODE_BASE = "https://nominatim.openstreetmap.org/search";
    var branches = [];

    for (var _i = 0; _i < rawBranches.length; _i++) {
      var b = rawBranches[_i];
      var addr = (b.Address || "") + ", Toronto, Ontario, Canada";
      var addrHash = addressHash(addr);
      var geoCacheKey = "tpl-geo:" + addrHash;
      var coords = null;

      try {
        // Check cache first for geocoding result
        var cachedGeo = await getFromRedis(geoCacheKey);
        if (cachedGeo) {
          var parsedGeo = JSON.parse(cachedGeo);
          coords = { lat: parsedGeo.lat, lon: parsedGeo.lon };
        } else {
          // Cache miss - geocode the address
          var geoRes = await fetch(GEOCODE_BASE + "?q=" + encodeURIComponent(addr) + "&format=json&limit=1", {
            headers: { "User-Agent": "WorldMonitor/1.0" },
            signal: AbortSignal.timeout(5000)
          });
          if (geoRes.ok) {
            var geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              coords = { lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon) };
              // Cache the result with 7-day TTL
              await setInRedis(geoCacheKey, JSON.stringify(coords), CACHE_TTL_SECONDS);
            }
          }
          // Rate limit: 1 request per second for Nominatim (only on cache miss)
          if (_i < rawBranches.length - 1) {
            await new Promise(function(r) { setTimeout(r, 1100); });
          }
        }

        if (coords) {
          branches.push({
            id: "tpl-" + (b._id || _i),
            name: b.BranchName || b.name || "",
            address: b.Address || "",
            city: "Toronto",
            postalCode: b.PostalCode || "",
            branchType: "public",
            phone: b.Telephone || "",
            website: b.Website || "",
            latitude: coords.lat,
            longitude: coords.lon
          });
        } else {
          branches.push({
            id: "tpl-" + (b._id || _i),
            name: b.BranchName || b.name || "",
            address: b.Address || "",
            city: "Toronto",
            postalCode: b.PostalCode || "",
            branchType: "public",
            phone: b.Telephone || "",
            website: b.Website || "",
            latitude: 0,
            longitude: 0
          });
        }
      } catch (geoErr) {
        branches.push({
          id: "tpl-" + (b._id || _i),
          name: b.BranchName || b.name || "",
          address: b.Address || "",
          city: "Toronto",
          postalCode: b.PostalCode || "",
          branchType: "public",
          phone: b.Telephone || "",
          website: b.Website || "",
          latitude: 0,
          longitude: 0
        });
      }
    }

    // Filter out branches with no coordinates
    var validBranches = branches.filter(function(br) { return br.latitude !== 0 && br.longitude !== 0; });
    if (validBranches.length === 0) validBranches = SEED_TPL_DATA.branches;

    var responseData = {
      branches: validBranches,
      total: validBranches.length,
      lastUpdated: now,
      source: validBranches.length > 0 ? "ckan_api" : "seed_data"
    };

    var responseBody = JSON.stringify(responseData);
    await setInRedis(CACHE_KEY, responseBody, CACHE_TTL_SECONDS);

    return jsonResponse(responseData, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("TPL Libraries API error:", error);
    // Return seed data as fallback
    return jsonResponse({
      branches: SEED_TPL_DATA.branches,
      total: SEED_TPL_DATA.branches.length,
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