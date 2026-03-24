/**
 * Court & Judicial Facility Locations
 * Source: Manual compilation - Toronto-area courthouses
 * Geometry: Facility points (courthouse markers)
 * Default: OFF (P4 - lowest priority)
 */

export interface CourtFacility {
  id: string;
  name: string;
  address: string;
  type: 'provincial' | 'federal' | 'small_claims' | 'family';
  latitude: number;
  longitude: number;
}

// Seed data for Toronto-area courthouses
export const COURT_FACILITIES_SEED: CourtFacility[] = [
  {
    id: 'court-001',
    name: 'Toronto Courthouse',
    address: '361 University Ave, Toronto, ON M5G 1T3',
    type: 'provincial',
    latitude: 43.6547,
    longitude: -79.3877,
  },
  {
    id: 'court-002',
    name: 'Old City Hall Courthouse',
    address: '60 Queen St W, Toronto, ON M5H 2M3',
    type: 'provincial',
    latitude: 43.6532,
    longitude: -79.3832,
  },
  {
    id: 'court-003',
    name: 'Superior Court of Justice',
    address: '393 University Ave, Toronto, ON M5G 1E6',
    type: 'provincial',
    latitude: 43.6538,
    longitude: -79.3895,
  },
  {
    id: 'court-004',
    name: 'Ontario Court of Justice - Scarborough',
    address: '1911 Eglinton Ave E, Scarborough, ON M1L 7K2',
    type: 'provincial',
    latitude: 43.7115,
    longitude: -79.2847,
  },
  {
    id: 'court-005',
    name: 'Ontario Court of Justice - North York',
    address: '1000 Finch Ave W, North York, ON M3J 2V5',
    type: 'provincial',
    latitude: 43.7575,
    longitude: -79.4665,
  },
  {
    id: 'court-006',
    name: 'Ontario Court of Justice - Etobicoke',
    address: '2700 Eglinton Ave W, Etobicoke, ON M9V 3A8',
    type: 'provincial',
    latitude: 43.6942,
    longitude: -79.5668,
  },
  {
    id: 'court-007',
    name: 'Small Claims Court - Toronto',
    address: '393 University Ave, Toronto, ON M5G 1E6',
    type: 'small_claims',
    latitude: 43.6538,
    longitude: -79.3895,
  },
  {
    id: 'court-008',
    name: 'Family Court - Toronto',
    address: '393 University Ave, Toronto, ON M5G 1E6',
    type: 'family',
    latitude: 43.6538,
    longitude: -79.3895,
  },
  {
    id: 'court-009',
    name: 'Federal Court - Toronto',
    address: '180 Queen St W, Toronto, ON M5V 3X4',
    type: 'federal',
    latitude: 43.6460,
    longitude: -79.3855,
  },
  {
    id: 'court-010',
    name: 'Tax Court of Canada - Toronto',
    address: '200 King St W, Toronto, ON M5H 3T2',
    type: 'federal',
    latitude: 43.6480,
    longitude: -79.3840,
  },
];

export function getCourtFacilityColor(type: CourtFacility['type']): [number, number, number, number] {
  switch (type) {
    case 'federal':
      return [255, 100, 100, 200] as [number, number, number, number]; // Red
    case 'provincial':
      return [100, 150, 255, 200] as [number, number, number, number]; // Blue
    case 'small_claims':
      return [150, 255, 150, 200] as [number, number, number, number]; // Green
    case 'family':
      return [255, 200, 100, 200] as [number, number, number, number]; // Orange
    default:
      return [150, 150, 150, 200] as [number, number, number, number]; // Gray
  }
}

export function getCourtFacilityIcon(type: CourtFacility['type']): string {
  // Use different icons for different court types
  switch (type) {
    case 'federal':
      return '⚖️';
    case 'provincial':
      return '🏛️';
    case 'small_claims':
      return '📋';
    case 'family':
      return '👨‍👩‍👧‍👦';
    default:
      return '⚖️';
  }
}