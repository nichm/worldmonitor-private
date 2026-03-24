/**
 * Toronto Police Divisions
 * Source: ArcGIS FeatureServer — Police Divisions
 */

export interface PoliceDivision {
  id: string;
  division: string;
  divisionName: string;
  shape: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}