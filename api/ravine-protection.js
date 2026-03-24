// api/ravine-protection.js
// Edge Function: serves ravine protection area data from ArcGIS
// Cache: 30-day TTL

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var DATA_URL = "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial13/FeatureServer/70/query?f=geojson&outSR=4326&where=1%3D1&outFields=*&resultRecordCount=50";
var CACHE_KEY = "ravine-protection";
var CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

async function handler(req) {
  var now = new Date().toISOString();

  try {
    // Try cache first
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.areas && cached.areas.length > 0) {
      return jsonResponse({
        areas: cached.areas,
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
    var areas = [];

    for (var _i = 0; _i < features.length; _i++) {
      var feature = features[_i];
      if (!feature || !feature.geometry || !feature.geometry.coordinates) continue;

      var props = feature.properties || {};
      var coords = feature.geometry.coordinates;

      // Handle both Polygon and MultiPolygon
      var coordinates = Array.isArray(coords[0]?.[0]?.[0])
        ? coords[0] // MultiPolygon: take first polygon
        : coords; // Polygon

      if (!coordinates || coordinates.length < 3) continue;

      areas.push({
        id: props.OBJECTID || props.id || ("ravine-" + _i),
        areaName: props.AREA_NAME || props.area_name || "",
        bylawDate: props.BY_LAW_DATE || props.bylaw_date || "",
        qualifier: props.QUALIFIER || props.qualifier || "",
        description: props.DESCRIPTION || props.description || "",
        areaHa: Number(props.SHAPE_Area || props.area || 0) / 10000, // Convert m² to hectares
        coordinates: coordinates,
      });
    }

    var response = {
      areas: areas,
      total: areas.length,
      lastUpdated: now,
    };

    // Cache the result
    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
      "Access-Control-Allow-Origin": "*",
    });
  } catch (err) {
    console.error("Ravine Protection API error:", err);
    return jsonResponse({
      areas: [],
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