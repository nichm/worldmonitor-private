/**
 * Toronto Crime Incidents
 * Source: ArcGIS FeatureServer — Major Crime Indicators Open Data
 */

export interface CrimeIncident {
  id: string;
  mciCategory: string;
  occurrenceDate: string;
  occurrenceYear: number;
  occurrenceMonth: number;
  occurrenceDay: number;
  occurrenceHour: number | null;
  occurrenceDayOfWeek: number | null;
  division: number;
  hood158: string;
  neighbourhood158: string;
  long: number;
  lat: number;
  premisesType: string | null;
  offence: string;
  reportedDate: string;
  reportedYear: number;
  reportedMonth: number;
  reportedDay: number;
  reportedHour: number | null;
  reportedDayOfWeek: number | null;
  ucrCode: string | null;
  ucrExt: string | null;
  offenceSubtype: string | null;
  reportedhour: number | null;
  reportedday: number | null;
  reportedmonth: number | null;
  reportedyear: number;
}

export function getCrimeIncidentSummary(incidents: CrimeIncident[]) {
  const summary: Record<string, number> = {};

  for (const incident of incidents) {
    const category = incident.mciCategory || "Unknown";
    summary[category] = (summary[category] || 0) + 1;
  }

  return summary;
}

export function getCrimeIncidentColor(category: string): [number, number, number, number] {
  const colorMap: Record<string, [number, number, number, number]> = {
    Assault: [239, 68, 68, 200], // red
    "Break and Enter": [249, 115, 22, 200], // orange
    "Auto Theft": [234, 179, 8, 200], // yellow
    Robbery: [168, 85, 247, 200], // purple
    "Theft Over": [59, 130, 246, 200], // blue
  };

  return colorMap[category] || [107, 114, 128, 180]; // gray fallback
}