/**
 * Police Divisions service — fetches division boundaries via ArcGIS
 */
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { PoliceDivision } from '@/config/police-divisions';

const API_URL =
  "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Police_Divisions/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson";

const breaker = createCircuitBreaker<PoliceDivision[]>({
  name: 'PoliceDivisions',
  cacheTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days (static data)
  persistCache: true,
});

const emptyFallback: PoliceDivision[] = [];

/**
 * Fetch police division boundaries
 */
export async function fetchPoliceDivisions(): Promise<PoliceDivision[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('police-divisions') as PoliceDivision[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const res = await fetch(API_URL, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Police Divisions API error: ${res.status}`);
      }
      const geojson = await res.json();

      if (!geojson.features || !Array.isArray(geojson.features)) {
        throw new Error("Invalid GeoJSON structure");
      }

      const features: PoliceDivision[] = geojson.features.map((feature: any) => {
        const props = feature.properties || {};
        const geometry = feature.geometry;

        return {
          id: props.OBJECTID || props.DIVISION?.toString() || "",
          division: props.DIVISION?.toString() || "",
          divisionName: props.DIVISION_NAME || props.DIVISION || "",
          shape: geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        };
      });

      return features;
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Police Divisions data:', error);
    return emptyFallback;
  }
}