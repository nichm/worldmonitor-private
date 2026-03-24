/**
 * AGCO Liquor Licences (Toronto)
 * Source: Alcohol and Gaming Commission of Ontario
 */

export interface AGCOLicence {
  id: string;
  businessName: string;
  licenceType: string; // convenience, grocery, lcbo_agency
  address: string;
  city: string;
  postalCode?: string;
  municipality: string;
  ward?: string;
  latitude: number;
  longitude: number;
  licenceNumber: string;
  status: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface AGCOLicenceData {
  licences: AGCOLicence[];
  total: number;
  byType: Record<string, number>;
  byWard: Record<string, number>;
}

export function getLicenceTypeColor(licenceType: string): string {
  const normalized = licenceType?.toLowerCase() || '';

  if (normalized.includes('convenience')) return '#f59e0b'; // orange
  if (normalized.includes('grocery')) return '#10b981'; // green
  if (normalized.includes('lcbo') || normalized.includes('agency')) return '#3b82f6'; // blue

  return '#6b7280'; // gray
}

export function getLicenceRadius(licence: AGCOLicence): number {
  // All licences same size for visibility
  return 10;
}

export function summarizeAGCOLicenceData(licences: AGCOLicence[]): AGCOLicenceData {
  const byType: Record<string, number> = {};
  const byWard: Record<string, number> = {};

  for (const licence of licences) {
    const type = licence.licenceType || 'unknown';
    byType[type] = (byType[type] || 0) + 1;

    const ward = licence.ward || 'Unknown';
    byWard[ward] = (byWard[ward] || 0) + 1;
  }

  return {
    licences,
    total: licences.length,
    byType,
    byWard,
  };
}