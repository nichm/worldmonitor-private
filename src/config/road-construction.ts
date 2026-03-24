/**
 * Road Construction & Closures
 * Source: City of Toronto Open Data - https://secure.toronto.ca/opendata/cart/road_restrictions/v3?format=json
 * Geometry: Construction point locations
 * Default: ON (P2)
 */

export interface RoadConstructionEvent {
  id: string;
  eventTitle: string;
  eventType: string;
  classification: string;
  roadName: string | null;
  from: string | null;
  to: string | null;
  direction: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
}

export const ROAD_RESTRICTIONS_URL = 'https://secure.toronto.ca/opendata/cart/road_restrictions/v3?format=json';

export function getRoadConstructionColor(classification: string, status: string): [number, number, number, number] {
  // Color based on status and classification
  if (status?.toLowerCase() === 'active') {
    // Active construction - orange
    return [255, 140, 0, 220] as [number, number, number, number];
  } else if (classification?.toLowerCase().includes('major')) {
    // Major road work - red
    return [255, 80, 80, 220] as [number, number, number, number];
  } else if (classification?.toLowerCase().includes('planned')) {
    // Planned work - yellow
    return [255, 215, 0, 200] as [number, number, number, number];
  } else {
    // Default - blue
    return [100, 150, 255, 200] as [number, number, number, number];
  }
}

export function getRoadConstructionIcon(eventType: string): string {
  const type = (eventType || '').toLowerCase();
  if (type.includes('closure') || type.includes('road closure')) {
    return '🚧';
  } else if (type.includes('construction')) {
    return '🚧';
  } else if (type.includes('rescu')) {
    return '🚨';
  } else if (type.includes('lanes')) {
    return '↔️';
  } else {
    return '🚧';
  }
}