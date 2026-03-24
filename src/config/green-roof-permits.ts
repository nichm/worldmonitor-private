/**
 * Green Roof Permits (Toronto)
 * Source: Toronto Open Data
 */

export interface GreenRoofPermit {
  id: string;
  permitNumber: string;
  address: string;
  city: string;
  postalCode?: string;
  ward?: string;
  latitude: number;
  longitude: number;
  permitType: string; // bylaw, voluntary
  greenRoofArea: number; // square meters
  buildingType?: string;
  applicant?: string;
  issueDate: string;
  year: number;
  status: string;
}

export interface GreenRoofPermitData {
  permits: GreenRoofPermit[];
  total: number;
  totalAreaSqm: number;
  byPermitType: Record<string, number>;
  byYear: Record<string, number>;
}

export function getPermitTypeColor(permitType: string): string {
  const normalized = permitType?.toLowerCase() || '';

  if (normalized.includes('bylaw')) return '#10b981'; // green (mandatory)
  if (normalized.includes('voluntary')) return '#3b82f6'; // blue

  return '#6b7280'; // gray
}

export function getPermitRadius(permit: GreenRoofPermit): number {
  // Scale radius by area (min 8, max 16)
  const area = permit.greenRoofArea || 100;
  return Math.max(8, Math.min(16, 8 + (area / 500) * 2));
}

export function getBylawNotice(): string {
  return 'Green Roof Bylaw revoked Nov 2025 — voluntary applications only.';
}

export function summarizeGreenRoofPermitData(permits: GreenRoofPermit[]): GreenRoofPermitData {
  let totalAreaSqm = 0;
  const byPermitType: Record<string, number> = {};
  const byYear: Record<string, number> = {};

  for (const permit of permits) {
    totalAreaSqm += permit.greenRoofArea || 0;

    const type = permit.permitType || 'unknown';
    byPermitType[type] = (byPermitType[type] || 0) + 1;

    const year = permit.year?.toString() || 'unknown';
    byYear[year] = (byYear[year] || 0) + 1;
  }

  return {
    permits,
    total: permits.length,
    totalAreaSqm,
    byPermitType,
    byYear,
  };
}