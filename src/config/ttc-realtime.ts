/**
 * TTC Real-Time Vehicle Positions
 * Source: TTC GTFS-RT - https://gtfsrt.ttc.ca/vehiclepositions
 * Note: This is a Protocol Buffer (protobuf) feed, not JSON
 * TODO: Implement protobuf parsing to use live feed
 * Geometry: Vehicle points colored by route type
 * Default: ON (P1 - highest value, high refresh rate)
 */

export interface TtcVehicle {
  id: string;
  vehicleId: string;
  routeId: string;
  routeType: 'subway' | 'streetcar' | 'bus';
  direction: string | null;
  latitude: number;
  longitude: number;
  bearing: number | null;
  speed: number | null; // km/h
  occupancyStatus: string | null;
  lastUpdated: string;
}

// Seed data for TTC vehicles (sample data across Toronto)
// TODO: Replace with live protobuf feed parsing
export const TTC_VEHICLES_SEED: TtcVehicle[] = [
  // Subway vehicles
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
  // Streetcar vehicles
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
  // Bus vehicles
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

export function getTtcVehicleColor(routeType: TtcVehicle['routeType']): [number, number, number, number] {
  switch (routeType) {
    case 'subway':
      return [255, 215, 0, 220] as [number, number, number, number]; // Yellow
    case 'streetcar':
      return [255, 100, 100, 220] as [number, number, number, number]; // Red
    case 'bus':
      return [100, 150, 255, 220] as [number, number, number, number]; // Blue
    default:
      return [150, 150, 150, 200] as [number, number, number, number]; // Gray
  }
}

export function getTtcVehicleIcon(routeType: TtcVehicle['routeType']): string {
  switch (routeType) {
    case 'subway':
      return '🚇';
    case 'streetcar':
      return '🚋';
    case 'bus':
      return '🚌';
    default:
      return '🚍';
  }
}