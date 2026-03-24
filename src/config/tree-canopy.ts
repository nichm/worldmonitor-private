/**
 * Tree Canopy & Green Space
 * Source: ArcGIS FeatureServer — cot_geospatial13/FeatureServer/43 (Toronto Urban Forest)
 * Geometry: Polygon with urban forest canopy coverage
 */

export interface TreeCanopyArea {
  id: string;
  areaName: string;
  canopyType: string;
  treeSpecies: string;
  areaHa: number; // Area in hectares
  canopyCoverPercent: number; // Canopy coverage percentage
  coordinates: number[][][]; // Polygon coordinates: [[[lon, lat], ...]]
}

export const TREE_CANOPY_URL =
  'https://gis.toronto.ca/arcgis/rest/services/cot_geospatial13/FeatureServer/43/query?f=geojson&outSR=4326&where=1%3D1&outFields=*&resultRecordCount=500';

export let treeCanopyAreas: TreeCanopyArea[] = [];

function parseArea(feature: any): TreeCanopyArea | null {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return null;

  const props = feature.properties || {};
  const coords = feature.geometry.coordinates;

  // Handle both Polygon and MultiPolygon
  const coordinates: number[][][] = Array.isArray(coords[0]?.[0]?.[0])
    ? (coords as number[][][][])[0] // MultiPolygon: take first polygon
    : (coords as number[][][]); // Polygon

  if (!coordinates || coordinates.length < 3) return null;

  return {
    id: props.OBJECTID || props.id || `canopy-${Math.random().toString(36).substr(2, 9)}`,
    areaName: props.AREA_NAME || props.area_name || 'Unknown Area',
    canopyType: props.CANOPY_TYPE || props.canopy_type || 'Unknown',
    treeSpecies: props.TREE_SPECIES || props.tree_species || 'Mixed',
    areaHa: Number(props.SHAPE_Area || props.area || 0) / 10000, // Convert m² to hectares
    canopyCoverPercent: Number(props.CANOPY_COVER || props.canopy_cover || 0),
    coordinates,
  };
}

export async function fetchTreeCanopy(): Promise<TreeCanopyArea[]> {
  try {
    const res = await fetch(TREE_CANOPY_URL);
    if (!res.ok) throw new Error(`Tree Canopy API error: ${res.status}`);
    const geojson = await res.json();

    const features = geojson.features || [];
    const areas: TreeCanopyArea[] = [];

    for (const feature of features) {
      const area = parseArea(feature);
      if (area) areas.push(area);
    }

    treeCanopyAreas = areas;
    return areas;
  } catch (error) {
    console.error('[App] Tree Canopy fetch failed:', error);
    return [];
  }
}

/** Derive summary stats */
export interface TreeCanopySummary {
  totalAreas: number;
  totalAreaHa: number;
  totalCanopyHa: number;
  avgCanopyCoverPercent: number;
  bySpecies: Record<string, { count: number; areaHa: number; canopyHa: number }>;
}

export function summarizeTreeCanopy(areas: TreeCanopyArea[]): TreeCanopySummary {
  const bySpecies: Record<string, { count: number; areaHa: number; canopyHa: number }> = {};

  let totalAreaHa = 0;
  let totalCanopyHa = 0;
  let totalCanopyPercent = 0;

  for (const area of areas) {
    totalAreaHa += area.areaHa;
    const canopyHa = area.areaHa * (area.canopyCoverPercent / 100);
    totalCanopyHa += canopyHa;
    totalCanopyPercent += area.canopyCoverPercent;

    const species = area.treeSpecies || 'Unknown';
    if (!bySpecies[species]) bySpecies[species] = { count: 0, areaHa: 0, canopyHa: 0 };
    bySpecies[species].count++;
    bySpecies[species].areaHa += area.areaHa;
    bySpecies[species].canopyHa += canopyHa;
  }

  return {
    totalAreas: areas.length,
    totalAreaHa,
    totalCanopyHa,
    avgCanopyCoverPercent: areas.length > 0 ? totalCanopyPercent / areas.length : 0,
    bySpecies,
  };
}