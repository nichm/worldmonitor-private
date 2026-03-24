// api/bike-share.js
// Edge Function: serves bike share GBFS data from Toronto Bike Share
// Cache: 2-minute TTL

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var STATION_INFO_URL = "https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information.json";
var STATION_STATUS_URL = "https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_status.json";
var CACHE_KEY = "bike-share";
var CACHE_TTL_SECONDS = 2 * 60; // 2 minutes

function mergeStation(info, status) {
  if (!info || !status || info.station_id !== status.station_id) return null;

  return {
    id: info.station_id,
    stationId: info.station_id,
    name: info.name || "Unknown Station",
    latitude: Number(info.lat || 0),
    longitude: Number(info.lon || 0),
    capacity: Number(info.capacity || 0),
    bikesAvailable: Number(status.num_bikes_available || 0),
    docksAvailable: Number(status.num_docks_available || 0),
    isInstalled: status.is_installed === true || status.is_installed === 1,
    isRenting: status.is_renting === true || status.is_renting === 1,
    isReturning: status.is_returning === true || status.is_returning === 1,
    lastReported: status.last_reported || new Date().toISOString(),
  };
}

async function handler(req) {
  var now = new Date().toISOString();

  try {
    // Try cache first
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.stations && cached.stations.length > 0) {
      return jsonResponse({
        stations: cached.stations,
        total: cached.total,
        lastUpdated: cached.lastUpdated || now,
        cached: true,
      }, 200, {
        "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=30",
        "Access-Control-Allow-Origin": "*",
      });
    }

    // Fetch station information and status in parallel
    var [infoRes, statusRes] = await Promise.all([
      fetch(STATION_INFO_URL),
      fetch(STATION_STATUS_URL),
    ]);

    if (!infoRes.ok) {
      throw new Error("Bike Share Info API error: " + infoRes.status);
    }
    if (!statusRes.ok) {
      throw new Error("Bike Share Status API error: " + statusRes.status);
    }

    var infoJson = await infoRes.json();
    var statusJson = await statusRes.json();

    var infoData = infoJson.data && infoJson.data.stations ? infoJson.data.stations : [];
    var statusData = statusJson.data && statusJson.data.stations ? statusJson.data.stations : [];

    // Create a map for fast lookup
    var statusMap = new Map();
    for (var _i = 0; _i < statusData.length; _i++) {
      statusMap.set(statusData[_i].station_id, statusData[_i]);
    }

    var stations = [];

    for (var _j = 0; _j < infoData.length; _j++) {
      var info = infoData[_j];
      var status = statusMap.get(info.station_id);
      if (status) {
        var station = mergeStation(info, status);
        if (station) {
          stations.push(station);
        }
      }
    }

    var response = {
      stations: stations,
      total: stations.length,
      lastUpdated: now,
    };

    // Cache the result
    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=30",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (err) {
    console.error("Bike Share API error:", err);
    return jsonResponse({
      stations: [],
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