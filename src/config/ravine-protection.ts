/**
 * Ravine & Natural Feature Protection Areas
 * Source: ArcGIS FeatureServer — cot_geospatial13/FeatureServer/70
 * Geometry: Polygon with bylaw protection details
 */

export interface RavineProtectionArea {
  id: string;
  areaName: string;
  bylawDate: string;
  qualifier: string;
  description: string;
  areaHa: number; // Area in hectares
  coordinates: number[][][]; // Polygon coordinates: [[[lon, lat], ...]]
}

export const RAVINE_PROTECTION_URL =
  'https://gis.toronto.ca/arcgis/rest/services/cot_geospatial13/FeatureServer/70/query?f=geojson&outSR=4326&where=1%3D1&outFields=*';

export let ravineProtectionAreas: RavineProtectionArea[] = [];

function parseArea(feature: any): RavineProtectionArea | null {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return null;

  const props = feature.properties || {};
  const coords = feature.geometry.coordinates;

  // Handle both Polygon and MultiPolygon
  const coordinates: number[][][] = Array.isArray(coords[0]?.[0]?.[0])
    ? (coords as number[][][][])[0] // MultiPolygon: take first polygon
    : (coords as number[][][]); // Polygon

  if (!coordinates || coordinates.length < 3) return null;

  return {
    id: props.OBJECTID || props.id || `ravine-${Math.random().toString(36).substr(2, 9)}`,
    areaName: props.AREA_NAME || props.area_name || '',
    bylawDate: props.BY_LAW_DATE || props.bylaw_date || '',
    qualifier: props.QUALIFIER || props.qualifier || '',
    description: props.DESCRIPTION || props.description || '',
    areaHa: Number(props.SHAPE_Area || props.area || 0) / 10000, // Convert m² to hectares (1 ha = 10,000 m²)
    coordinates,
  };
}

export async function fetchRavineProtection(): Promise<RavineProtectionArea[]> {
  try {
    const res = await fetch(RAVINE_PROTECTION_URL);
    if (!res.ok) throw new Error(`Ravine Protection API error: ${res.status}`);
    const geojson = await res.json();

    const features = geojson.features || [];
    const areas: RavineProtectionArea[] = [];

    for (const feature of features) {
      const area = parseArea(feature);
      if (area) areas.push(area);
    }

    ravineProtectionAreas = areas;
    return areas;
  } catch (error) {
    console.error('[App] Ravine Protection fetch failed:', error);
    return [];
  }
}

/** Derive summary stats */
export interface RavineProtectionSummary {
  totalAreas: number;
  totalAreaHa: number;
  byQualifier: Record<string, { count: number; areaHa: number }>;
}

export function summarizeRavineProtection(areas: RavineProtectionArea[]): RavineProtectionSummary {
  const byQualifier: Record<string, { count: number; areaHa: number }> = {};

  let totalAreaHa = 0;

  for (const area of areas) {
    totalAreaHa += area.areaHa;

    const qualifier = area.qualifier || 'Unknown';
    if (!byQualifier[qualifier]) byQualifier[qualifier] = { count: 0, areaHa: 0 };
    byQualifier[qualifier].count++;
    byQualifier[qualifier].areaHa += area.areaHa;
  }

  return {
    totalAreas: areas.length,
    totalAreaHa,
    byQualifier,
  };
}