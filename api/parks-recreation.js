// api/parks-recreation.js
// Edge Function: serves static GeoJSON (CKAN) merged with live centres.json status
// Cache: monthly TTL for static, 15 min for live (via HTTP cache headers — no Redis needed for edge)

function sanitizeJsonValue(value, depth = 0) {
  if (depth > 20) return "[truncated]";
  if (value instanceof Error) return { error: value.message };
  if (Array.isArray(value)) return value.map((item) => sanitizeJsonValue(item, depth + 1));
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
    headers: { "Content-Type": "application/json", ...headers },
  });
}

var config = { runtime: "edge" };

var CKAN_BASE_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca";
var STATIC_RESOURCE_ID = "f6cdcd50-da7b-4ede-8e60-c3cdba70b559";
var LIVE_STATUS_URL = "https://www.toronto.ca/data/parks/live/centres.json";

// Amenity detection keywords from facility names/descriptions
var AMENITY_KEYWORDS = [
  { type: "pool", keywords: ["pool", "aquatic", "swim", "splash pad", "splash_pad"] },
  { type: "rink", keywords: ["rink", "arena", "ice", "skating"] },
  { type: "gym", keywords: ["gym", "fitness", "weight", "exercise", "community centre", "community_center"] },
  { type: "playground", keywords: ["playground", "play structure", "play area"] },
  { type: "field", keywords: ["field", "soccer", "baseball", "football", "cricket"] },
  { type: "court", keywords: ["court", "tennis", "basketball", "volleyball"] },
  { type: "track", keywords: ["track", "running"] },
  { type: "splash_pad", keywords: ["splash pad", "splash_pad", "wading"] },
];

function detectAmenityTypes(name, description) {
  var text = ((name || "") + " " + (description || "")).toLowerCase();
  var types = new Set();
  for (var _i = 0; _i < AMENITY_KEYWORDS.length; _i++) {
    var entry = AMENITY_KEYWORDS[_i];
    for (var _j = 0; _j < entry.keywords.length; _j++) {
      if (text.indexOf(entry.keywords[_j]) !== -1) {
        types.add(entry.type);
        break;
      }
    }
  }
  return types.size > 0 ? Array.from(types) : ["other"];
}

function getPrimaryAmenityType(types) {
  // Priority order for primary display
  var priority = ["pool", "rink", "gym", "community_centre", "playground", "splash_pad", "field", "court", "track", "other"];
  for (var _i = 0; _i < priority.length; _i++) {
    if (types.indexOf(priority[_i]) !== -1) return priority[_i];
  }
  return "other";
}

async function fetchStaticGeoJSON() {
  // Try the GeoJSON resource directly first
  var geoUrl = CKAN_BASE_URL + "/api/3/action/resource_show?id=" + STATIC_RESOURCE_ID;
  var res = await fetch(geoUrl);
  if (!res.ok) throw new Error("CKAN resource_show failed: " + res.status);
  var resourceData = await res.json();
  if (!resourceData.success || !resourceData.result) throw new Error("Invalid CKAN response");

  var url = resourceData.result.url || resourceData.result.download_url;
  if (!url) throw new Error("No download URL in CKAN resource");

  var geoRes = await fetch(url);
  if (!geoRes.ok) throw new Error("GeoJSON fetch failed: " + geoRes.status);
  return await geoRes.json();
}

async function fetchLiveStatus() {
  try {
    var res = await fetch(LIVE_STATUS_URL);
    if (!res.ok) return {};
    var data = await res.json();
    // centres.json is typically an array of objects with location/status info
    // Build a map by name for fuzzy matching
    var statusMap = {};
    if (Array.isArray(data)) {
      for (var _i = 0; _i < data.length; _i++) {
        var centre = data[_i];
        var name = (centre.name || centre.title || centre.location_name || "").toLowerCase().trim();
        if (!name) continue;
        statusMap[name] = {
          liveStatus: (centre.status || "").toLowerCase() === "open" ? "open"
            : (centre.status || "").toLowerCase() === "closed" ? "closed"
            : (centre.status || "").toLowerCase() === "limited" ? "limited"
            : "unknown",
          liveDetail: centre.detail || centre.note || centre.description || undefined,
        };
      }
    } else if (data && typeof data === "object") {
      // Object form: iterate values
      var keys = Object.keys(data);
      for (var _j = 0; _j < keys.length; _j++) {
        var centre = data[keys[_j]];
        var name = (centre.name || centre.title || centre.location_name || keys[_j] || "").toLowerCase().trim();
        if (!name) continue;
        statusMap[name] = {
          liveStatus: (centre.status || "").toLowerCase() === "open" ? "open"
            : (centre.status || "").toLowerCase() === "closed" ? "closed"
            : (centre.status || "").toLowerCase() === "limited" ? "limited"
            : "unknown",
          liveDetail: centre.detail || centre.note || centre.description || undefined,
        };
      }
    }
    return statusMap;
  } catch (err) {
    console.error("Failed to fetch live status:", err);
    return {};
  }
}

function extractCoordinates(feature) {
  // Handle Point, MultiPoint, Polygon, MultiPolygon
  var geom = feature.geometry || feature;
  if (!geom) return null;
  if (geom.type === "Point" && geom.coordinates) {
    return { lat: geom.coordinates[1], lon: geom.coordinates[0] };
  }
  if (geom.type === "MultiPoint" && geom.coordinates && geom.coordinates.length > 0) {
    return { lat: geom.coordinates[0][1], lon: geom.coordinates[0][0] };
  }
  if (geom.type === "Polygon" && geom.coordinates) {
    // Centroid approximation
    var ring = geom.coordinates[0];
    var sumLat = 0, sumLon = 0;
    for (var _i = 0; _i < ring.length; _i++) {
      sumLon += ring[_i][0];
      sumLat += ring[_i][1];
    }
    return { lat: sumLat / ring.length, lon: sumLon / ring.length };
  }
  if (geom.type === "MultiPolygon" && geom.coordinates) {
    var ring = geom.coordinates[0][0];
    var sumLat = 0, sumLon = 0;
    for (var _i = 0; _i < ring.length; _i++) {
      sumLon += ring[_i][0];
      sumLat += ring[_i][1];
    }
    return { lat: sumLat / ring.length, lon: sumLon / ring.length };
  }
  return null;
}

async function handler(req) {
  var now = new Date().toISOString();
  var staticLastUpdated = now;
  var liveLastUpdated = now;
  var facilities = [];

  try {
    var results = await Promise.allSettled([fetchStaticGeoJSON(), fetchLiveStatus()]);

    var geojson = results[0].status === "fulfilled" ? results[0].value : null;
    var liveStatusMap = results[1].status === "fulfilled" ? results[1].value : {};

    if (!geojson) {
      var staticError = results[0].status === "rejected" ? results[0].reason.message : "Unknown error";
      return jsonResponse({
        facilities: [],
        total: 0,
        lastUpdated: now,
        staticLastUpdated: now,
        liveLastUpdated: now,
        error: "Failed to fetch static GeoJSON: " + staticError,
      }, 502);
    }

    var features = (geojson.features || []).filter(function (f) {
      return extractCoordinates(f) !== null;
    });

    for (var _i = 0; _i < features.length; _i++) {
      var feature = features[_i];
      var props = feature.properties || {};
      var coords = extractCoordinates(feature);
      if (!coords) continue;

      var name = props.name || props.NAME || props.title || props.LOCATION_NAME || "";
      var nameLower = name.toLowerCase().trim();
      var amenityTypes = detectAmenityTypes(name, props.description || props.DESCRIPTION || "");
      // Check if "community_centre" should be set from type field
      var facilityType = (props.type || props.TYPE || props.facility_type || "").toLowerCase();
      if (facilityType.indexOf("community") !== -1 && amenityTypes.indexOf("community_centre") === -1) {
        amenityTypes.push("community_centre");
      }

      // Match live status
      var liveMatch = liveStatusMap[nameLower];
      if (!liveMatch) {
        // Try partial match
        var statusKeys = Object.keys(liveStatusMap);
        for (var _j = 0; _j < statusKeys.length; _j++) {
          if (nameLower.indexOf(statusKeys[_j]) !== -1 || statusKeys[_j].indexOf(nameLower) !== -1) {
            liveMatch = liveStatusMap[statusKeys[_j]];
            break;
          }
        }
      }

      facilities.push({
        id: props.id || props.OBJECTID || ("park-" + _i),
        name: name,
        address: props.address || props.ADDRESS || props.street || "",
        amenityType: getPrimaryAmenityType(amenityTypes),
        amenityFlags: amenityTypes,
        lat: coords.lat,
        lon: coords.lon,
        ward: props.ward || props.WARD || undefined,
        description: props.description || props.DESCRIPTION || undefined,
        liveStatus: (liveMatch && liveMatch.liveStatus) || "unknown",
        liveDetail: (liveMatch && liveMatch.liveDetail) || undefined,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.error("Parks & Recreation API error:", err);
    return jsonResponse({
      facilities: [],
      total: 0,
      lastUpdated: now,
      staticLastUpdated: now,
      liveLastUpdated: now,
      error: err.message || "Unknown error",
    }, 500);
  }

  return jsonResponse({
    facilities: facilities,
    total: facilities.length,
    lastUpdated: now,
    staticLastUpdated: staticLastUpdated,
    liveLastUpdated: liveLastUpdated,
  }, 200, {
    "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    "Access-Control-Allow-Origin": "*",
  });
}

export { config, handler as default };
