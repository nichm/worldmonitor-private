/**
 * Flooding Composite API
 * Edge function - returns seed data
 * TODO: Implement live data fetching from TRCA and ECCC hydrometric when APIs are available
 */

import { jsonResponse } from './_json-response.js';
import { jsonWithUpstashCache } from './_upstash-json.js';

// Seed data embedded in edge function
// TODO: Replace with live data from TRCA and ECCC hydrometric when APIs are available
const FLOOD_ZONES_SEED = [
  {
    id: 'flood-zone-001',
    name: 'Don River Flood Plain',
    zoneType: 'flood_plain',
    riskLevel: 'high',
    description: 'Flood plain along the Don River corridor',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-79.35, 43.65],
        [-79.33, 43.65],
        [-79.33, 43.68],
        [-79.35, 43.68],
        [-79.35, 43.65],
      ]],
    },
  },
  {
    id: 'flood-zone-002',
    name: 'Humber River Flood Plain',
    zoneType: 'flood_plain',
    riskLevel: 'high',
    description: 'Flood plain along the Humber River corridor',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-79.50, 43.63],
        [-79.47, 43.63],
        [-79.47, 43.68],
        [-79.50, 43.68],
        [-79.50, 43.63],
      ]],
    },
  },
  {
    id: 'flood-zone-003',
    name: 'Etobicoke Creek Flood Franchise',
    zoneType: 'flood_franchise',
    riskLevel: 'moderate',
    description: 'Flood franchise area along Etobicoke Creek',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-79.60, 43.60],
        [-79.56, 43.60],
        [-79.56, 43.65],
        [-79.60, 43.65],
        [-79.60, 43.60],
      ]],
    },
  },
  {
    id: 'flood-zone-004',
    name: 'Rouge River Flood Plain',
    zoneType: 'flood_plain',
    riskLevel: 'moderate',
    description: 'Flood plain along Rouge River in Scarborough',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-79.18, 43.75],
        [-79.15, 43.75],
        [-79.15, 43.82],
        [-79.18, 43.82],
        [-79.18, 43.75],
      ]],
    },
  },
];

const FLOOD_REPORTS_SEED = [
  {
    id: 'flood-report-001',
    reportType: 'basement_flooding',
    location: '123 Main St, Toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    reportedDate: '2024-03-15T10:30:00Z',
    severity: 'major',
    description: 'Significant basement flooding due to heavy rainfall',
    status: 'resolved',
  },
  {
    id: 'flood-report-002',
    reportType: 'surface_flooding',
    location: '456 Queen St W, Toronto',
    latitude: 43.6470,
    longitude: -79.3950,
    reportedDate: '2024-03-20T14:15:00Z',
    severity: 'moderate',
    description: 'Street flooding blocking traffic',
    status: 'closed',
  },
  {
    id: 'flood-report-003',
    reportType: 'stream_flooding',
    location: 'Lower Don River trail',
    latitude: 43.6550,
    longitude: -79.3550,
    reportedDate: '2024-03-25T09:45:00Z',
    severity: 'minor',
    description: 'Minor overflow of Don River onto trail',
    status: 'resolved',
  },
  {
    id: 'flood-report-004',
    reportType: 'basement_flooding',
    location: '789 King St E, Toronto',
    latitude: 43.6500,
    longitude: -79.3600,
    reportedDate: '2024-04-01T16:20:00Z',
    severity: 'major',
    description: 'Basement flooding affecting multiple units',
    status: 'in_progress',
  },
  {
    id: 'flood-report-005',
    reportType: 'surface_flooding',
    location: '321 Bay St, Toronto',
    latitude: 43.6480,
    longitude: -79.3800,
    reportedDate: '2024-04-05T11:00:00Z',
    severity: 'minor',
    description: 'Ponding water near subway entrance',
    status: 'open',
  },
];

const HYDROMETRIC_STATIONS_SEED = [
  {
    id: 'station-001',
    name: 'Don River at Lawrence Ave',
    watercourse: 'Don River',
    latitude: 43.7150,
    longitude: -79.3550,
    waterLevel: 1.5,
    waterLevelTrend: 'stable',
    floodStage: 2.2,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'station-002',
    name: 'Humber River at Bloor St',
    watercourse: 'Humber River',
    latitude: 43.6600,
    longitude: -79.4900,
    waterLevel: 1.2,
    waterLevelTrend: 'rising',
    floodStage: 1.8,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'station-003',
    name: 'Rouge River at Steeles Ave',
    watercourse: 'Rouge River',
    latitude: 43.8100,
    longitude: -79.1800,
    waterLevel: 0.8,
    waterLevelTrend: 'falling',
    floodStage: 1.5,
    lastUpdated: new Date().toISOString(),
  },
];

var config = { runtime: 'edge' };
var CACHE_TTL = 900; // 15 minutes

async function handler() {
  try {
    const data = {
      floodZones: FLOOD_ZONES_SEED,
      floodReports: FLOOD_REPORTS_SEED,
      hydrometricStations: HYDROMETRIC_STATIONS_SEED,
    };

    const result = await jsonWithUpstashCache(
      'flooding-composite',
      data,
      { revalidate: CACHE_TTL }
    );

    // Add CORS and Cache-Control headers manually
    return new Response(result.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=' + (CACHE_TTL / 2) + ', s-maxage=' + CACHE_TTL,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Flooding Composite API] Error:', error);
    return jsonResponse({
      floodZones: [],
      floodReports: [],
      hydrometricStations: [],
      error: String(error)
    }, 200, {
      'Cache-Control': 'public, max-age=60, s-maxage=120',
      'Access-Control-Allow-Origin': '*',
    });
  }
}

export { config, handler as default };