/**
 * Ontario Wildfire & Fire Risk Zones API
 * Edge function - returns seed data
 * TODO: Implement live data fetching when CWFIS API is fixed
 */

import { jsonResponse } from './_json-response.js';
import { jsonWithUpstashCache } from './_upstash-json.js';

// Seed data embedded in edge function
// TODO: Replace with live data from CWFIS when API is fixed
const WILDFIRES_SEED = [
  {
    id: 'wildfire-001',
    name: 'Parry Sound Fire',
    type: 'wildfire',
    status: 'out',
    cause: 'Lightning',
    discoveryDate: '2024-06-15T10:00:00Z',
    size: 15.5,
    latitude: 45.3278,
    longitude: -80.0342,
    region: 'Parry Sound',
  },
  {
    id: 'wildfire-002',
    name: 'Algonquin Park Fire',
    type: 'wildfire',
    status: 'under_control',
    cause: 'Human',
    discoveryDate: '2024-07-02T14:30:00Z',
    size: 8.2,
    latitude: 45.6780,
    longitude: -78.4560,
    region: 'Algonquin Park',
  },
  {
    id: 'wildfire-003',
    name: 'North Bay Fire',
    type: 'wildfire',
    status: 'being_held',
    cause: 'Lightning',
    discoveryDate: '2024-07-20T09:15:00Z',
    size: 3.5,
    latitude: 46.3092,
    longitude: -79.4597,
    region: 'North Bay',
  },
  {
    id: 'wildfire-004',
    name: 'Sudbury Fire',
    type: 'wildfire',
    status: 'not_contained',
    cause: 'Human',
    discoveryDate: '2024-07-25T16:45:00Z',
    size: 22.8,
    latitude: 46.4917,
    longitude: -80.9932,
    region: 'Sudbury',
  },
  {
    id: 'wildfire-005',
    name: 'Timiskaming Fire',
    type: 'wildfire',
    status: 'ongoing',
    cause: 'Lightning',
    discoveryDate: '2024-07-28T11:30:00Z',
    size: 45.2,
    latitude: 47.1580,
    longitude: -79.8200,
    region: 'Timiskaming',
  },
];

const FIRE_RISK_ZONES_SEED = [
  {
    id: 'risk-zone-001',
    name: 'Northern Ontario High Risk',
    riskLevel: 'high',
    description: 'Elevated fire risk due to dry conditions and warm temperatures',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-80.0, 45.0],
        [-78.0, 45.0],
        [-78.0, 47.0],
        [-80.0, 47.0],
        [-80.0, 45.0],
      ]],
    },
  },
  {
    id: 'risk-zone-002',
    name: 'Central Ontario Moderate Risk',
    riskLevel: 'moderate',
    description: 'Moderate fire risk in forested areas',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-79.5, 44.0],
        [-78.0, 44.0],
        [-78.0, 45.5],
        [-79.5, 45.5],
        [-79.5, 44.0],
      ]],
    },
  },
];

export async function GET() {
  try {
    const data = {
      wildfires: WILDFIRES_SEED,
      riskZones: FIRE_RISK_ZONES_SEED,
    };

    return await jsonWithUpstashCache(
      'ontario-wildfires',
      data,
      { revalidate: 1800 } // 30 minute cache
    );
  } catch (error) {
    console.error('[Ontario Wildfires API] Error:', error);
    return jsonResponse({ wildfires: [], riskZones: [], error: String(error) }, 200);
  }
}

export const config = { runtime: 'edge' };
export { GET as default };