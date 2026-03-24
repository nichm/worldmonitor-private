// api/eccc-aqhi.js
// Edge Function: ECCC Air Quality Health Index (AQHI) observations
// Cache: 1-hour TTL

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var BBOX = "-79.7,43.5,-79.1,43.85";
var DATA_URL = "https://api.weather.gc.ca/collections/aqhi-observations-realtime/items?bbox=" + BBOX + "&limit=100";
var CACHE_KEY = "eccc-aqhi";
var CACHE_TTL_SECONDS = 60 * 60; // 1 hour

async function handler(_req) {
  var now = new Date().toISOString();

  try {
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.readings && cached.readings.length > 0) {
      return jsonResponse(cached, 200, {
        "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      });
    }

    var res = await fetch(DATA_URL, {
      headers: { "User-Agent": "WorldMonitor/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error("ECCC fetch failed: " + res.status);

    var geojson = await res.json();
    var features = geojson.features || [];
    var readings = [];

    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      if (!feature || !feature.geometry) continue;
      var props = feature.properties || {};
      var coords = feature.geometry.coordinates || [0, 0];

      var aqhi = props.aqhi || props.AQHI || null;
      if (aqhi === null || aqhi < 1) continue;

      readings.push({
        id: props.location_id || String(i),
        timestamp: props.observation_datetime_text_en || now,
        latitude: coords[1] || 0,
        longitude: coords[0] || 0,
        aqhi: aqhi,
        stationName: props.location_name_en || "",
        province: props.province || "",
        stationId: props.location_id || "",
      });
    }

    var summary = { lowRisk: 0, moderateRisk: 0, highRisk: 0, veryHighRisk: 0, averageAQHI: 0, maxAQHI: 0, byStation: {} };
    var totalAQHI = 0;

    for (var j = 0; j < readings.length; j++) {
      var r = readings[j];
      totalAQHI += r.aqhi;
      if (r.aqhi > summary.maxAQHI) summary.maxAQHI = r.aqhi;
      if (r.aqhi <= 3) summary.lowRisk++;
      else if (r.aqhi <= 6) summary.moderateRisk++;
      else if (r.aqhi <= 9) summary.highRisk++;
      else summary.veryHighRisk++;

      var station = r.stationName || "Unknown";
      if (!summary.byStation[station]) {
        summary.byStation[station] = { stationName: r.stationName, stationId: r.stationId, aqhi: r.aqhi, latitude: r.latitude, longitude: r.longitude };
      }
    }
    if (readings.length > 0) summary.averageAQHI = Math.round(totalAQHI / readings.length);

    var response = { readings: readings, summary: summary, total: readings.length, lastUpdated: now };
    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (error) {
    console.error("ECCC AQHI API error:", error);
    return jsonResponse({ readings: [], summary: {}, total: 0, lastUpdated: now, error: error.message }, 200, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      "Access-Control-Allow-Origin": "*",
    });
  }
}

export { config, handler as default };
