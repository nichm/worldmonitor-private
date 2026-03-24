/**
 * ECCC AQHI service — fetches Air Quality Health Index via Environment Canada API
 */
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { AQHIReading } from '@/config/eccc-aqhi';
import { getAQHISummary } from '@/config/eccc-aqhi';

const getApiUrl = (bbox: string) =>
  `https://api.weather.gc.ca/collections/air-quality-daily-and-hourly-local-air-quality-index/items?bbox=${bbox}&limit=100`;

const breaker = createCircuitBreaker<AQHIReading[]>({
  name: 'ECCCAQHI',
  cacheTtlMs: 60 * 60 * 1000, // 1 hour
  persistCache: true,
});

const emptyFallback: AQHIReading[] = [];

/**
 * Fetch AQHI readings
 */
export async function fetchAQHI(): Promise<AQHIReading[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('eccc-aqhi') as AQHIReading[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      // Toronto bbox
      const bbox = "-79.7,43.5,-79.1,43.85";
      const url = getApiUrl(bbox);
      const res = await fetch(url, {
        headers: { Accept: "application/geo+json" },
      });
      if (!res.ok) {
        throw new Error(`ECCC AQHI API error: ${res.status}`);
      }
      const geojson = await res.json();

      if (!geojson.features || !Array.isArray(geojson.features)) {
        throw new Error("Invalid GeoJSON structure");
      }

      const features: AQHIReading[] = geojson.features
        .map((feature: any) => {
          const props = feature.properties || {};
          const coords = feature.geometry?.coordinates || [0, 0];

          // Only include readings with valid AQHI values
          const aqhi = props.AQHI ?? props.aqhi ?? null;
          if (aqhi === null || aqhi === undefined || aqhi < 1) {
            return null;
          }

          return {
            id: props.id || feature.id || `${props.station_id}-${props.timestamp}`,
            timestamp: props.timestamp || props.TIME_STAMP || "",
            latitude: coords[1] || props.LATITUDE || 0,
            longitude: coords[0] || props.LONGITUDE || 0,
            aqhi: aqhi,
            aqhiCategory: props.AQHI_CATEGORY || props.aqhi_category || "",
            stationName: props.STATION_NAME || props.station_name || "",
            province: props.PROVINCE || props.province || "",
            stationId: props.STATION_ID || props.station_id || "",
          };
        })
        .filter((reading): reading is AQHIReading => reading !== null);

      return features;
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch ECCC AQHI data:', error);
    return emptyFallback;
  }
}

/**
 * Get summary statistics
 */
export function getAQHISummaryFromService(readings: AQHIReading[]) {
  return getAQHISummary(readings);
}

// Re-export from config for backward compatibility
export { getAQHIColor, getAQHICategory, getAQHISummary } from '@/config/eccc-aqhi';