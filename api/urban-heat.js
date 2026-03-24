// api/urban-heat.js
// Edge Function: serves Toronto urban heat island zone data
// Cache: 1-hour TTL

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var CACHE_KEY = "urban-heat";
var CACHE_TTL_SECONDS = 60 * 60; // 1 hour

// Seed data for Toronto urban heat island zones
// Heat zones are based on urban development density, heat vulnerability, and temperature differentials
var SEED_ZONES = [
  {
    id: "downtown-core",
    name: "Downtown Core",
    description: "Highest heat vulnerability due to dense development, tall buildings, and limited green space",
    heatIndex: 95, // Very high (0-100 scale)
    temperatureDelta: 6.5, // Degrees above surrounding rural areas
    imperviousSurface: 85, // Percentage
    greenSpace: 8, // Percentage
    populationDensity: 25000, // People per sq km
    riskLevel: "critical",
    coordinates: [
      [-79.395, 43.645],
      [-79.375, 43.645],
      [-79.375, 43.660],
      [-79.395, 43.660],
    ],
  },
  {
    id: "financial-district",
    name: "Financial District",
    description: "High heat vulnerability from tall canyon streets and glass facades",
    heatIndex: 88,
    temperatureDelta: 5.2,
    imperviousSurface: 92,
    greenSpace: 3,
    populationDensity: 18000,
    riskLevel: "high",
    coordinates: [
      [-79.385, 43.648],
      [-79.375, 43.648],
      [-79.375, 43.655],
      [-79.385, 43.655],
    ],
  },
  {
    id: "entertainment-district",
    name: "Entertainment District",
    description: "Moderate-high heat vulnerability from dense mixed-use development",
    heatIndex: 82,
    temperatureDelta: 4.8,
    imperviousSurface: 80,
    greenSpace: 10,
    populationDensity: 15000,
    riskLevel: "high",
    coordinates: [
      [-79.400, 43.640],
      [-79.380, 43.640],
      [-79.380, 43.650],
      [-79.400, 43.650],
    ],
  },
  {
    id: "yorkville",
    name: "Yorkville",
    description: "High heat vulnerability from luxury towers and limited tree canopy",
    heatIndex: 79,
    temperatureDelta: 4.5,
    imperviousSurface: 78,
    greenSpace: 12,
    populationDensity: 12000,
    riskLevel: "high",
    coordinates: [
      [-79.390, 43.670],
      [-79.380, 43.670],
      [-79.380, 43.680],
      [-79.390, 43.680],
    ],
  },
  {
    id: "king-west",
    name: "King West",
    description: "Moderate heat vulnerability from mid-rise condos and commercial",
    heatIndex: 75,
    temperatureDelta: 4.0,
    imperviousSurface: 75,
    greenSpace: 15,
    populationDensity: 10000,
    riskLevel: "medium",
    coordinates: [
      [-79.410, 43.640],
      [-79.390, 43.640],
      [-79.390, 43.650],
      [-79.410, 43.650],
    ],
  },
  {
    id: "cityplace",
    name: "CityPlace",
    description: "Very high heat vulnerability from densely-packed tower clusters",
    heatIndex: 90,
    temperatureDelta: 5.8,
    imperviousSurface: 88,
    greenSpace: 5,
    populationDensity: 22000,
    riskLevel: "critical",
    coordinates: [
      [-79.395, 43.635],
      [-79.380, 43.635],
      [-79.380, 43.645],
      [-79.395, 43.645],
    ],
  },
  {
    id: "harbourfront",
    name: "Harbourfront",
    description: "Moderate heat vulnerability, mitigated by lake proximity",
    heatIndex: 68,
    temperatureDelta: 3.5,
    imperviousSurface: 70,
    greenSpace: 18,
    populationDensity: 8000,
    riskLevel: "medium",
    coordinates: [
      [-79.400, 43.630],
      [-79.380, 43.630],
      [-79.380, 43.640],
      [-79.400, 43.640],
    ],
  },
  {
    id: "liberty-village",
    name: "Liberty Village",
    description: "Moderate-high heat vulnerability from industrial-to-residential conversion",
    heatIndex: 77,
    temperatureDelta: 4.2,
    imperviousSurface: 76,
    greenSpace: 14,
    populationDensity: 11000,
    riskLevel: "medium",
    coordinates: [
      [-79.425, 43.635],
      [-79.410, 43.635],
      [-79.410, 43.645],
      [-79.425, 43.645],
    ],
  },
  {
    id: "west-end-high-rises",
    name: "West End High-Rises",
    description: "Moderate heat vulnerability from scattered tower clusters",
    heatIndex: 72,
    temperatureDelta: 3.8,
    imperviousSurface: 72,
    greenSpace: 16,
    populationDensity: 9000,
    riskLevel: "medium",
    coordinates: [
      [-79.440, 43.650],
      [-79.420, 43.650],
      [-79.420, 43.665],
      [-79.440, 43.665],
    ],
  },
  {
    id: "midtown-north-york",
    name: "Midtown (North York)",
    description: "Moderate heat vulnerability from office towers and residential",
    heatIndex: 70,
    temperatureDelta: 3.6,
    imperviousSurface: 70,
    greenSpace: 17,
    populationDensity: 8500,
    riskLevel: "medium",
    coordinates: [
      [-79.400, 43.760],
      [-79.380, 43.760],
      [-79.380, 43.775],
      [-79.400, 43.775],
    ],
  },
  {
    id: "scarborough-city-centre",
    name: "Scarborough City Centre",
    description: "Moderate heat vulnerability from suburban commercial core",
    heatIndex: 65,
    temperatureDelta: 3.2,
    imperviousSurface: 68,
    greenSpace: 20,
    populationDensity: 7000,
    riskLevel: "medium",
    coordinates: [
      [-79.250, 43.770],
      [-79.230, 43.770],
      [-79.230, 43.785],
      [-79.250, 43.785],
    ],
  },
  {
    id: "etobicoke-centre",
    name: "Etobicoke Centre",
    description: "Lower heat vulnerability from mixed development with green buffers",
    heatIndex: 58,
    temperatureDelta: 2.8,
    imperviousSurface: 60,
    greenSpace: 25,
    populationDensity: 5500,
    riskLevel: "low",
    coordinates: [
      [-79.550, 43.650],
      [-79.530, 43.650],
      [-79.530, 43.665],
      [-79.550, 43.665],
    ],
  },
];

async function handler(req) {
  var now = new Date().toISOString();

  try {
    // Try cache first
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.zones && cached.zones.length > 0) {
      return jsonResponse({
        zones: cached.zones,
        total: cached.total,
        lastUpdated: cached.lastUpdated || now,
        cached: true,
        source: "seed-data",
      }, 200, {
        "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      });
    }

    // Use seed data as primary source
    // In the future, this could fetch from U of T School of Cities or HealthyPlan.City
    var response = {
      zones: SEED_ZONES,
      total: SEED_ZONES.length,
      lastUpdated: now,
      source: "seed-data",
      notes: "Heat zones based on urban development density, impervious surface, and green space analysis",
    };

    // Cache the result
    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (err) {
    console.error("Urban Heat API error:", err);
    return jsonResponse({
      zones: [],
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