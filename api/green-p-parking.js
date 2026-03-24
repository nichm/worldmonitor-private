// api/green-p-parking.js
// Edge Function: serves Green P Parking 2019 snapshot data
// Cache: 30-day TTL (frozen data, no updates expected)

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var DATA_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/b66466c3-69c8-4825-9c8b-04b270069193/resource/8549d588-30b0-482e-b872-b21beefdda22/download/green-p-parking-2019.json";
var CACHE_KEY = "green-p-parking";
var CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

async function handler(req) {
  var now = new Date().toISOString();

  try {
    // Try cache first
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.lots && cached.lots.length > 0) {
      return jsonResponse({
        lots: cached.lots,
        total: cached.total,
        lastUpdated: cached.lastUpdated || now,
        cached: true,
      }, 200, {
        "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
        "Access-Control-Allow-Origin": "*",
      });
    }

    // Fetch from CKAN
    var res = await fetch(DATA_URL);
    if (!res.ok) {
      throw new Error("CKAN fetch failed: " + res.status);
    }

    var data = await res.json();

    // Handle both array and object response formats
    var items = Array.isArray(data) ? data : (data?.data ?? data?.features ?? []);
    var lots = [];

    for (var _i = 0; _i < items.length; _i++) {
      var item = items[_i];
      var lat = Number(item.lat || item.Lat || item.LAT);
      var lng = Number(item.lng || item.Lng || item.LON || item.lon);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        lots.push({
          _id: item._id || _i,
          id: item.id || ("greenp-" + _i),
          name: item.name || item.NAME || "",
          address: item.address || item.ADDRESS || "",
          lat: lat,
          lng: lng,
          capacity: Number(item.capacity || item.Capacity || 0),
          rate1Hr: Number(item.rate1hr || item.RATE1HR || 0),
          rate2Hr: Number(item.rate2hr || item.RATE2HR || 0),
          rateMax: Number(item.ratemax || item.RATEMAX || 0),
          paymentType: item.paymenttype || item.PAYMENTTYPE || "",
          type: item.type || item.TYPE || "",
          notes: item.notes || item.NOTES,
        });
      }
    }

    var response = {
      lots: lots,
      total: lots.length,
      lastUpdated: now,
    };

    // Cache the result
    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
      "Access-Control-Allow-Origin": "*",
    });
  } catch (err) {
    console.error("Green P Parking API error:", err);
    return jsonResponse({
      lots: [],
      total: 0,
      lastUpdated: now,
      error: err.message || "Unknown error",
    }, 500, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      "Access-Control-Allow-Origin": "*",
    });
  }
}

export { config, handler as default };