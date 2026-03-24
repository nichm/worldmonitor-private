/**
 * Flooding Composite
 * Source: Multiple - TRCA flood zones + 311 flooding complaints + basement study
 * Note: TRCA API endpoints need investigation, using seed data
 * TODO: Implement live data fetching from TRCA and ECCC hydrometric
 * Geometry: Flood zones (GeoJsonLayer) + flood reports (ScatterplotLayer)
 * Default: OFF (P2)
 */

export interface FloodZone {
  id: string;
  name: string;
  zoneType: 'flood_plain' | 'flood_franchise' | 'flood_vulnerable_cluster';
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  description: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface FloodReport {
  id: string;
  reportType: '311_complaint' | 'basement_flooding' | 'surface_flooding' | 'stream_flooding';
  location: string;
  latitude: number;
  longitude: number;
  reportedDate: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

export interface HydrometricStation {
  id: string;
  name: string;
  watercourse: string;
  latitude: number;
  longitude: number;
  waterLevel: number | null; // meters
  waterLevelTrend: 'rising' | 'falling' | 'stable';
  floodStage: number | null; // meters
  lastUpdated: string;
}

// Seed data for flood zones (TRCA areas)
// TODO: Replace with live data from TRCA when API is available
export const FLOOD_ZONES_SEED: FloodZone[] = [
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

// Seed data for flood reports (311 complaints)
// TODO: Replace with live data from City of Toronto 311 API when available
export const FLOOD_REPORTS_SEED: FloodReport[] = [
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

// Seed data for hydrometric stations
// TODO: Replace with live data from ECCC hydrometric API
export const HYDROMETRIC_STATIONS_SEED: HydrometricStation[] = [
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

export function getFloodZoneColor(riskLevel: FloodZone['riskLevel']): [number, number, number, number] {
  switch (riskLevel) {
    case 'low':
      return [100, 150, 255, 120] as [number, number, number, number]; // Blue, low opacity
    case 'moderate':
      return [100, 200, 255, 160] as [number, number, number, number]; // Light blue
    case 'high':
      return [50, 150, 255, 200] as [number, number, number, number]; // Medium blue
    case 'very_high':
      return [0, 100, 255, 220] as [number, number, number, number]; // Dark blue
    default:
      return [150, 150, 150, 120] as [number, number, number, number]; // Gray
  }
}

export function getFloodReportColor(severity: FloodReport['severity']): [number, number, number, number] {
  switch (severity) {
    case 'minor':
      return [100, 255, 100, 200] as [number, number, number, number]; // Green
    case 'moderate':
      return [255, 200, 0, 200] as [number, number, number, number]; // Yellow
    case 'major':
      return [255, 50, 50, 220] as [number, number, number, number]; // Red
    default:
      return [150, 150, 150, 200] as [number, number, number, number]; // Gray
  }
}

export function getHydrometricStationColor(waterLevel: number | null, floodStage: number | null): [number, number, number, number] {
  if (waterLevel === null || floodStage === null) {
    return [150, 150, 150, 200] as [number, number, number, number]; // Gray
  }

  const ratio = waterLevel / floodStage;

  if (ratio >= 1.0) {
    return [255, 50, 50, 220] as [number, number, number, number]; // Red - over flood stage
  } else if (ratio >= 0.8) {
    return [255, 165, 0, 200] as [number, number, number, number]; // Orange - near flood stage
  } else if (ratio >= 0.5) {
    return [255, 255, 0, 180] as [number, number, number, number]; // Yellow - moderate
  } else {
    return [100, 200, 255, 180] as [number, number, number, number]; // Blue - normal
  }
}