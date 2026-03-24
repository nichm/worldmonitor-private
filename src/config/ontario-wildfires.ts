/**
 * Ontario Wildfire & Fire Risk Zones
 * Source: CWFIS / NRCan - https://cwfis.cfs.nrcan.gc.ca
 * Note: API endpoints are currently returning errors, using seed data
 * TODO: Implement live data fetching when CWFIS API is fixed
 * Geometry: Fire locations (ScatterplotLayer) + risk zones (GeoJsonLayer)
 * Default: ON (P2, seasonal)
 */

export interface WildfireIncident {
  id: string;
  name: string;
  type: 'wildfire' | 'prescribed_burn' | 'controlled';
  status: 'out' | 'being_held' | 'under_control' | 'not_contained' | 'ongoing';
  cause: string | null;
  discoveryDate: string | null;
  size: number | null; // hectares
  latitude: number | null;
  longitude: number | null;
  region: string | null;
}

export interface FireRiskZone {
  id: string;
  name: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  description: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

// Seed data for Ontario wildfires (sample data around Greater Toronto Area)
// TODO: Replace with live data from CWFIS when API is fixed
export const WILDFIRES_SEED: WildfireIncident[] = [
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

// Seed data for fire risk zones (GeoJSON-like structure)
// TODO: Replace with live data from CWFIS when API is fixed
export const FIRE_RISK_ZONES_SEED: FireRiskZone[] = [
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

export function getWildfireColor(status: WildfireIncident['status']): [number, number, number, number] {
  switch (status) {
    case 'out':
      return [100, 255, 100, 200] as [number, number, number, number]; // Green
    case 'being_held':
      return [255, 255, 0, 200] as [number, number, number, number]; // Yellow
    case 'under_control':
      return [255, 200, 100, 200] as [number, number, number, number]; // Orange
    case 'not_contained':
      return [255, 100, 50, 220] as [number, number, number, number]; // Red-orange
    case 'ongoing':
      return [255, 50, 50, 230] as [number, number, number, number]; // Bright red
    default:
      return [150, 150, 150, 200] as [number, number, number, number]; // Gray
  }
}

export function getFireRiskZoneColor(riskLevel: FireRiskZone['riskLevel']): [number, number, number, number] {
  switch (riskLevel) {
    case 'low':
      return [100, 255, 100, 100] as [number, number, number, number]; // Green, semi-transparent
    case 'moderate':
      return [255, 255, 0, 150] as [number, number, number, number]; // Yellow, semi-transparent
    case 'high':
      return [255, 140, 0, 180] as [number, number, number, number]; // Orange, semi-transparent
    case 'extreme':
      return [255, 50, 50, 200] as [number, number, number, number]; // Red, semi-transparent
    default:
      return [150, 150, 150, 100] as [number, number, number, number]; // Gray, semi-transparent
  }
}