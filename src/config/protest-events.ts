/**
 * Toronto Protest & Demonstration Events
 * Source: API
 */

export interface ProtestEvent {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: 'government' | 'civic' | 'commercial' | 'diplomatic' | 'educational' | 'park' | 'transportation' | 'landmark' | 'law-enforcement';
  typicalCrowdSize: number;
  description: string;
}

export interface ProtestEventsData {
  events: ProtestEvent[];
  total: number;
  lastUpdated: string;
  dataSource: string;
}

export function getProtestEventTypeColor(type: string): string {
  switch (type) {
    case 'government':
      return '#ef4444'; // red
    case 'civic':
      return '#3b82f6'; // blue
    case 'commercial':
      return '#f59e0b'; // amber
    case 'diplomatic':
      return '#8b5cf6'; // purple
    case 'educational':
      return '#10b981'; // green
    case 'park':
      return '#22c55e'; // light green
    case 'transportation':
      return '#f97316'; // orange
    case 'landmark':
      return '#ec4899'; // pink
    case 'law-enforcement':
      return '#6366f1'; // indigo
    default:
      return '#6b7280'; // gray
  }
}

export function getProtestEventRadius(typicalCrowdSize: number): number {
  // Scale radius based on crowd size (in meters, roughly)
  // Small: < 500, Medium: 500-2000, Large: 2000-5000, Very Large: > 5000
  if (typicalCrowdSize < 500) {
    return 50; // 50m radius
  } else if (typicalCrowdSize < 2000) {
    return 100; // 100m radius
  } else if (typicalCrowdSize < 5000) {
    return 200; // 200m radius
  } else {
    return 300; // 300m radius
  }
}

export function getProtestEventTypeLabel(type: string): string {
  switch (type) {
    case 'government':
      return 'Government';
    case 'civic':
      return 'Civic';
    case 'commercial':
      return 'Commercial';
    case 'diplomatic':
      return 'Diplomatic';
    case 'educational':
      return 'Educational';
    case 'park':
      return 'Park';
    case 'transportation':
      return 'Transportation';
    case 'landmark':
      return 'Landmark';
    case 'law-enforcement':
      return 'Law Enforcement';
    default:
      return 'Other';
  }
}

export function getCrowdSizeLabel(typicalCrowdSize: number): string {
  if (typicalCrowdSize < 500) {
    return 'Small (< 500)';
  } else if (typicalCrowdSize < 2000) {
    return 'Medium (500-2,000)';
  } else if (typicalCrowdSize < 5000) {
    return 'Large (2,000-5,000)';
  } else {
    return 'Very Large (5,000+)';
  }
}