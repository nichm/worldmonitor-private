/**
 * TTC Real-Time Vehicle Positions API
 * Edge function - returns seed data
 * TODO: Implement protobuf parsing for live feed at https://gtfsrt.ttc.ca/vehiclepositions
 */

import { jsonResponse } from './_json-response.js';
import { jsonWithUpstashCache } from './_upstash-json.js';

// Seed data embedded in edge function
// TODO: Replace with live protobuf feed parsing
const SEED_DATA = [
  {
    id: 'subway-001',
    vehicleId: '5001',
    routeId: 'YU-1',
    routeType: 'subway',
    direction: 'Northbound',
    latitude: 43.6532,
    longitude: -79.3832,
    bearing: 0,
    speed: 45,
    occupancyStatus: 'MANY_SEATS_AVAILABLE',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'subway-002',
    vehicleId: '5002',
    routeId: 'YU-1',
    direction: 'Southbound',
    latitude: 43.6700,
    longitude: -79.3840,
    bearing: 180,
    speed: 42,
    occupancyStatus: 'FULL',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'subway-003',
    vehicleId: '6001',
    routeId: 'BD-2',
    direction: 'Eastbound',
    latitude: 43.6580,
    longitude: -79.3900,
    bearing: 90,
    speed: 38,
    occupancyStatus: 'FEW_SEATS_AVAILABLE',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'streetcar-001',
    vehicleId: '4001',
    routeId: '501',
    routeType: 'streetcar',
    direction: 'Eastbound',
    latitude: 43.6520,
    longitude: -79.3950,
    bearing: 85,
    speed: 25,
    occupancyStatus: 'MANY_SEATS_AVAILABLE',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'streetcar-002',
    vehicleId: '4002',
    routeId: '510',
    routeType: 'streetcar',
    direction: 'Northbound',
    latitude: 43.6480,
    longitude: -79.4100,
    bearing: 5,
    speed: 20,
    occupancyStatus: 'STANDING_ROOM_ONLY',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'streetcar-003',
    vehicleId: '4003',
    routeId: '504',
    routeType: 'streetcar',
    direction: 'Westbound',
    latitude: 43.6600,
    longitude: -79.3800,
    bearing: 270,
    speed: 22,
    occupancyStatus: 'FEW_SEATS_AVAILABLE',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bus-001',
    vehicleId: '7001',
    routeId: '32',
    routeType: 'bus',
    direction: 'Eastbound',
    latitude: 43.6850,
    longitude: -79.4000,
    bearing: 88,
    speed: 30,
    occupancyStatus: 'MANY_SEATS_AVAILABLE',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bus-002',
    vehicleId: '7002',
    routeId: '29',
    routeType: 'bus',
    direction: 'Northbound',
    latitude: 43.6450,
    longitude: -79.4500,
    bearing: 2,
    speed: 28,
    occupancyStatus: 'FULL',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bus-003',
    vehicleId: '7003',
    routeId: '52',
    routeType: 'bus',
    direction: 'Southbound',
    latitude: 43.7200,
    longitude: -79.3400,
    bearing: 180,
    speed: 32,
    occupancyStatus: 'STANDING_ROOM_ONLY',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bus-004',
    vehicleId: '7004',
    routeId: '7',
    routeType: 'bus',
    direction: 'Westbound',
    latitude: 43.6300,
    longitude: -79.4200,
    bearing: 275,
    speed: 26,
    occupancyStatus: 'FEW_SEATS_AVAILABLE',
    lastUpdated: new Date().toISOString(),
  },
];

var config = { runtime: 'edge' };
var CACHE_TTL = 30; // 30 seconds

async function handler() {
  try {
    // Use very short cache for real-time data (30 seconds)
    const result = await jsonWithUpstashCache(
      'ttc-realtime',
      SEED_DATA,
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
    console.error('[TTC Real-Time API] Error:', error);
    return jsonResponse({ vehicles: [], error: String(error) }, 200, {
      'Cache-Control': 'public, max-age=10, s-maxage=30',
      'Access-Control-Allow-Origin': '*',
    });
  }
}

export { config, handler as default };