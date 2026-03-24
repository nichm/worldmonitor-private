/**
 * Cycling Network (Bikeways)
 * Source: ArcGIS FeatureServer — cot_geospatial2/FeatureServer/49
 * Geometry: Polyline with INFRA_HIGH classification
 */

export interface CyclingSegment {
  id: string;
  streetName: string;
  infraType: string; // INFRA_HIGH classification
  infraDesc: string; // Description of infrastructure type
  fromStreet: string;
  toStreet: string;
  lengthM: number; // Length in meters
  coordinates: number[][]; // [[lon, lat], [lon, lat], ...]
}

export type CyclingInfraType =
  | 'cycle_track' // Cycle Track (physically separated)
  | 'buffered_lane' // Buffered Bike Lane (painted buffer)
  | 'bike_lane' // Conventional Bike Lane
  | 'sharrows' // Shared lane markings
  | 'multi_use_path' // Multi-use pathway
  | 'other';

export const CYCLING_NETWORK_URL =
  'https://gis.toronto.ca/arcgis/rest/services/cot_geospatial2/FeatureServer/49/query?f=geojson&outSR=4326&where=1%3D1&outFields=*';

export let cyclingSegments: CyclingSegment[] = [];

function parseInfraType(infraHigh: string): CyclingInfraType {
  if (!infraHigh) return 'other';
  const normalized = infraHigh.toLowerCase();
  if (normalized.includes('cycle track') || normalized.includes('cycle_track')) return 'cycle_track';
  if (normalized.includes('buffered') || normalized.includes('buffered_lane')) return 'buffered_lane';
  if (normalized.includes('bike lane') || normalized.includes('bike_lane')) return 'bike_lane';
  if (normalized.includes('sharrow') || normalized.includes('shared lane')) return 'sharrows';
  if (normalized.includes('multi-use') || normalized.includes('trail') || normalized.includes('path')) return 'multi_use_path';
  return 'other';
}

function parseSegment(feature: any): CyclingSegment | null {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return null;

  const props = feature.properties || {};
  const coords = feature.geometry.coordinates;

  // Handle both LineString and MultiLineString
  const coordinates: number[][] = Array.isArray(coords[0]?.[0])
    ? (coords as number[][][])[0] // MultiLineString: take first segment
    : (coords as number[][]); // LineString

  if (!coordinates || coordinates.length < 2) return null;

  return {
    id: props.OBJECTID || props.id || `seg-${Math.random().toString(36).substr(2, 9)}`,
    streetName: props.STREET_NAME || props.street_name || '',
    infraType: parseInfraType(props.INFRA_HIGH || props.infra_high || ''),
    infraDesc: props.INFRA_HIGH || props.infra_high || '',
    fromStreet: props.FM_STREET || props.fm_street || '',
    toStreet: props.TO_STREET || props.to_street || '',
    lengthM: Number(props.SHAPE_Length || props.length || props.LENGTH || 0),
    coordinates,
  };
}

export async function fetchCyclingNetwork(): Promise<CyclingSegment[]> {
  try {
    const res = await fetch(CYCLING_NETWORK_URL);
    if (!res.ok) throw new Error(`Cycling Network API error: ${res.status}`);
    const geojson = await res.json();

    const features = geojson.features || [];
    const segments: CyclingSegment[] = [];

    for (const feature of features) {
      const seg = parseSegment(feature);
      if (seg) segments.push(seg);
    }

    cyclingSegments = segments;
    return segments;
  } catch (error) {
    console.error('[App] Cycling Network fetch failed:', error);
    return [];
  }
}

/** Get color for infrastructure type */
export function getCyclingInfraColor(type: CyclingInfraType): string {
  switch (type) {
    case 'cycle_track':
      return '#22c55e'; // Green - best protection
    case 'buffered_lane':
      return '#3b82f6'; // Blue - good protection
    case 'bike_lane':
      return '#f59e0b'; // Orange - basic protection
    case 'sharrows':
      return '#ef4444'; // Red - shared lane
    case 'multi_use_path':
      return '#10b981'; // Emerald green - separate path
    default:
      return '#94a3b8'; // Gray - unknown
  }
}

/** Derive summary stats */
export interface CyclingNetworkSummary {
  totalSegments: number;
  totalLengthKm: number;
  byInfraType: Record<CyclingInfraType, { count: number; lengthKm: number }>;
}

export function summarizeCyclingNetwork(segments: CyclingSegment[]): CyclingNetworkSummary {
  const byInfraType: Record<CyclingInfraType, { count: number; lengthKm: number }> = {
    cycle_track: { count: 0, lengthKm: 0 },
    buffered_lane: { count: 0, lengthKm: 0 },
    bike_lane: { count: 0, lengthKm: 0 },
    sharrows: { count: 0, lengthKm: 0 },
    multi_use_path: { count: 0, lengthKm: 0 },
    other: { count: 0, lengthKm: 0 },
  };

  let totalLengthM = 0;

  for (const seg of segments) {
    totalLengthM += seg.lengthM;
    const type = seg.infraType;
    if (!byInfraType[type]) byInfraType[type] = { count: 0, lengthKm: 0 };
    byInfraType[type].count++;
    byInfraType[type].lengthKm += seg.lengthM / 1000; // Convert to km
  }

  return {
    totalSegments: segments.length,
    totalLengthKm: totalLengthM / 1000,
    byInfraType,
  };
}