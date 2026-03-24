/**
 * Toronto Crime Incidents service — fetches major crime indicators via ArcGIS
 */
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { CrimeIncident } from '@/config/toronto-crime-incidents';
import { getCrimeIncidentSummary } from '@/config/toronto-crime-incidents';

const API_URL =
  "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson";

const breaker = createCircuitBreaker<CrimeIncident[]>({
  name: 'TorontoCrimeIncidents',
  cacheTtlMs: 6 * 60 * 60 * 1000, // 6 hours
  persistCache: true,
});

const emptyFallback: CrimeIncident[] = [];

/**
 * Fetch crime incidents
 */
export async function fetchCrimeIncidents(): Promise<CrimeIncident[]> {
  // Try hydrated data first
  const hydrated = getHydratedData('toronto-crime-incidents') as CrimeIncident[] | undefined;
  if (hydrated && hydrated.length > 0) return hydrated;

  try {
    const response = await breaker.execute(async () => {
      const res = await fetch(API_URL, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Crime Incidents API error: ${res.status}`);
      }
      const geojson = await res.json();

      if (!geojson.features || !Array.isArray(geojson.features)) {
        throw new Error("Invalid GeoJSON structure");
      }

      const features: CrimeIncident[] = geojson.features.map((feature: any) => {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates || [0, 0];

        return {
          id: props.OBJECTID || `${props.occurrence_year}-${props.OBJECTID}`,
          mciCategory: props.MCI_CATEGORY || "Unknown",
          occurrenceDate: props.occurrence_date || "",
          occurrenceYear: props.occurrence_year || 0,
          occurrenceMonth: props.occurrence_month || 0,
          occurrenceDay: props.occurrence_day || 0,
          occurrenceHour: props.occurrence_hour ?? null,
          occurrenceDayOfWeek: props.occurrence_day_of_week ?? null,
          division: props.Division || 0,
          hood158: props.Hood_158 || "",
          neighbourhood158: props.Neighbourhood_158 || "",
          long: coords[0] || 0,
          lat: coords[1] || 0,
          premisesType: props.premises_type ?? null,
          offence: props.offence || "",
          reportedDate: props.reported_date || "",
          reportedYear: props.reported_year || 0,
          reportedMonth: props.reported_month || 0,
          reportedDay: props.reported_day || 0,
          reportedHour: props.reported_hour ?? null,
          reportedDayOfWeek: props.reported_day_of_week ?? null,
          ucrCode: props.UCR_CODE ?? null,
          ucrExt: props.UCR_EXT ?? null,
          offenceSubtype: props.offence_subtype ?? null,
          reportedhour: props.reportedhour ?? null,
          reportedday: props.reportedday ?? null,
          reportedmonth: props.reportedmonth ?? null,
          reportedyear: props.reportedyear || 0,
        };
      });

      return features;
    }, emptyFallback);

    return response;
  } catch (error) {
    console.error('Failed to fetch Toronto Crime Incidents data:', error);
    return emptyFallback;
  }
}

/**
 * Get summary statistics
 */
export function getCrimeIncidentSummaryFromService(incidents: CrimeIncident[]) {
  return getCrimeIncidentSummary(incidents);
}

// Re-export from config for backward compatibility
export { getCrimeIncidentSummary } from '@/config/toronto-crime-incidents';