// api/cycling-network.js
// Edge Function: serves cycling network data from ArcGIS
// Cache: 7-day TTL

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var DATA_URL = "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial2/FeatureServer/49/query?f=json&outSR=4326&where=1%3D1&outFields=*";
var CACHE_KEY = "cycling-network";
var CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function parseInfraType(infraHigh) {
  if (!infraHigh) return "other";
  var normalized = infraHigh.toLowerCase();
  if (normalized.indexOf("cycle track") !== -1 || normalized.indexOf("cycle_track") !== -1) return "cycle_track";
  if (normalized.indexOf("buffered") !== -1 || normalized.indexOf("buffered_lane") !== -1) return "buffered_lane";
  if (normalized.indexOf("bike lane") !== -1 || normalized.indexOf("bike_lane") !== -1) return "bike_lane";
  if (normalized.indexOf("sharrow") !== -1 || normalized.indexOf("shared lane") !== -1) return "sharrows";
  if (normalized.indexOf("multi-use") !== -1 || normalized.indexOf("trail") !== -1 || normalized.indexOf("path") !== -1) return "multi_use_path";
  return "other";
}

async function handler(req) {
  var now = new Date().toISOString();

  try {
    // Try cache first
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.segments && cached.segments.length > 0) {
      return jsonResponse({
        segments: cached.segments,
        total: cached.total,
        lastUpdated: cached.lastUpdated || now,
        cached: true,
      }, 200, {
        "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
        "Access-Control-Allow-Origin": "*",
      });
    }

    // Fetch from ArcGIS
    var res = await fetch(DATA_URL);
    if (!res.ok) {
      throw new Error("ArcGIS fetch failed: " + res.status);
    }

    var geojson = await res.json();
    var features = geojson.features || [];
    var segments = [];

    for (var _i = 0; _i < features.length; _i++) {
      var feature = features[_i];
      if (!feature || !feature.geometry || !feature.geometry.coordinates) continue;

      var props = feature.properties || {};
      var coords = feature.geometry.coordinates;

      // Handle both LineString and MultiLineString
      var coordinates = Array.isArray(coords[0]?.[0])
        ? coords[0] // MultiLineString: take first segment
        : coords; // LineString

      if (!coordinates || coordinates.length < 2) continue;

      segments.push({
        id: props.OBJECTID || props.id || ("seg-" + _i),
        streetName: props.STREET_NAME || props.street_name || "",
        infraType: parseInfraType(props.INFRA_HIGH || props.infra_high || ""),
        infraDesc: props.INFRA_HIGH || props.infra_high || "",
        fromStreet: props.FM_STREET || props.fm_street || "",
        toStreet: props.TO_STREET || props.to_street || "",
        lengthM: Number(props.SHAPE_Length || props.length || props.LENGTH || 0),
        coordinates: coordinates,
      });
    }

    var response = {
      segments: segments,
      total: segments.length,
      lastUpdated: now,
    };

    // Cache the result
    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
      "Access-Control-Allow-Origin": "*",
    });
  } catch (err) {
    console.error("Cycling Network API error:", err);
    return jsonResponse({
      segments: [],
      total: 0,
      lastUpdated: now,
      error: err.message || "Unknown error",
    }, 200, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      "Access-Control-Allow-Origin": "*",
    });
  }
}

export { config, handler as default };