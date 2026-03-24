// api/police-divisions.js
// Edge Function: TPS Police Division Boundaries from ArcGIS
// Cache: 30-day TTL (static boundary data)

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var DATA_URL = "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/TPS_POLICE_DIVISIONS/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson";
var CACHE_KEY = "police-divisions";
var CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

async function handler(_req) {
  var now = new Date().toISOString();

  try {
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.divisions && cached.divisions.length > 0) {
      return jsonResponse(cached, 200, {
        "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
        "Access-Control-Allow-Origin": "*",
      });
    }

    var res = await fetch(DATA_URL, {
      headers: { "User-Agent": "WorldMonitor/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error("ArcGIS fetch failed: " + res.status);

    var geojson = await res.json();
    var features = geojson.features || [];
    var divisions = [];

    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      if (!feature || !feature.geometry) continue;
      var props = feature.properties || {};
      divisions.push({
        id: props.OBJECTID || props.DIV || String(i),
        division: String(props.DIV || ""),
        divisionName: props.UNIT_NAME || props.DIVISION_NAME || "",
        address: props.ADDRESS || "",
        areaSqKm: Number(props.AREA_SQKM || 0),
        geometry: feature.geometry,
      });
    }

    var response = {
      divisions: divisions,
      total: divisions.length,
      lastUpdated: now,
    };

    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
      "Access-Control-Allow-Origin": "*",
    });
  } catch (error) {
    console.error("Police Divisions API error:", error);
    return jsonResponse({
      divisions: [],
      total: 0,
      lastUpdated: now,
      error: error.message || "Unknown error",
    }, 200, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      "Access-Control-Allow-Origin": "*",
    });
  }
}

export { config, handler as default };
