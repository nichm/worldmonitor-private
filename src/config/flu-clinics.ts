/**
 * Flu Clinics (Ontario)
 * Source: Ontario flu shot clinic locations
 */

export interface FluClinic {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  clinicType: string; // public_health, pharmacy, community_health, hospital
  latitude: number;
  longitude: number;
  hours?: string;
  bookingRequired: boolean;
  ageGroups: string[];
  vaccinesAvailable: string[];
  status: string;
}

export interface FluClinicData {
  clinics: FluClinic[];
  total: number;
  byType: Record<string, number>;
}

export function isFluSeason(): boolean {
  const month = new Date().getMonth(); // 0-11
  return month >= 9 || month <= 2; // Oct (9) - Mar (2)
}

export function getClinicTypeColor(clinicType: string): string {
  const normalized = clinicType?.toLowerCase() || '';

  if (normalized.includes('public_health') || normalized.includes('public')) return '#3b82f6'; // blue
  if (normalized.includes('pharmacy')) return '#10b981'; // green
  if (normalized.includes('community') || normalized.includes('community_health')) return '#f59e0b'; // orange
  if (normalized.includes('hospital')) return '#ef4444'; // red

  return '#6b7280'; // gray
}

export function getClinicRadius(clinic: FluClinic): number {
  // All clinics same size for visibility
  return 12;
}

export function getSeasonalNotice(): string {
  if (isFluSeason()) {
    return 'Active flu season — clinics open October through March.';
  }
  return 'Seasonal layer — flu clinics are active October through March.';
}

export function summarizeFluClinicData(clinics: FluClinic[]): FluClinicData {
  const byType: Record<string, number> = {};

  for (const clinic of clinics) {
    const type = clinic.clinicType || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  }

  return {
    clinics,
    total: clinics.length,
    byType,
  };
}