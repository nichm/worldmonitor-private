// api/toronto-crime-incidents.js
// Edge Function: TPS Major Crime Indicators from ArcGIS
// Cache: 6-hour TTL via Upstash Redis

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var DATA_URL = "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson";
var CACHE_KEY = "crime-incidents";
var CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

async function handler(_req) {
  var now = new Date().toISOString();

  try {
    // Try cache first
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.incidents && cached.incidents.length > 0) {
      return jsonResponse(cached, 200, {
        "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
        "Access-Control-Allow-Origin": "*",
      });
    }

    // Fetch from TPS ArcGIS
    var res = await fetch(DATA_URL, {
      headers: { "User-Agent": "WorldMonitor/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error("ArcGIS fetch failed: " + res.status);

    var geojson = await res.json();
    var features = geojson.features || [];
    var incidents = [];

    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      if (!feature || !feature.geometry) continue;
      var props = feature.properties || {};
      var coords = feature.geometry.coordinates || [0, 0];
      incidents.push({
        id: props.OBJECTID || String(i),
        mciCategory: props.MCI_CATEGORY || "Unknown",
        occurrenceDate: props.occurrence_date || "",
        occurrenceYear: props.occurrence_year || 0,
        division: props.Division || 0,
        hood158: props.Hood_158 || "",
        neighbourhood158: props.Neighbourhood_158 || "",
        long: coords[0] || 0,
        lat: coords[1] || 0,
        offence: props.offence || "",
        premisesType: props.premises_type || "",
      });
    }

    var response = {
      incidents: incidents,
      total: incidents.length,
      lastUpdated: now,
    };

    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
      "Access-Control-Allow-Origin": "*",
    });
  } catch (error) {
    console.error("Crime Incidents API error:", error);
    return jsonResponse({
      incidents: [],
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
