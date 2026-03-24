/**
 * Childcare Centres (Ontario Ministry of Education)
 * Source: Ontario Ministry of Education licensed childcare data
 */

export interface ChildcareCentre {
  id: string;
  name: string;
  operator: string;
  licenceNumber: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  capacity: number;
  ageGroup: string; // infant, toddler, preschool, kindergarten
  latitude: number;
  longitude: number;
  status: string;
  licenceExpiry?: string;
}

export interface ChildcareData {
  centres: ChildcareCentre[];
  total: number;
  byAgeGroup: Record<string, number>;
  byOperator: Record<string, number>;
}

export function getAgeGroupColor(ageGroup: string): string {
  const normalized = ageGroup?.toLowerCase() || '';

  if (normalized.includes('infant')) return '#ec4899'; // pink
  if (normalized.includes('toddler')) return '#f59e0b'; // orange
  if (normalized.includes('preschool')) return '#3b82f6'; // blue
  if (normalized.includes('kindergarten')) return '#10b981'; // green

  return '#6b7280'; // gray
}

export function getCentreRadius(centre: ChildcareCentre): number {
  // Scale radius by capacity (min 8, max 20)
  const capacity = centre.capacity || 50;
  return Math.max(8, Math.min(20, 8 + (capacity / 50) * 2));
}

export function summarizeChildcareData(centres: ChildcareCentre[]): ChildcareData {
  const byAgeGroup: Record<string, number> = {};
  const byOperator: Record<string, number> = {};

  for (const centre of centres) {
    const ageGroup = centre.ageGroup || 'unknown';
    byAgeGroup[ageGroup] = (byAgeGroup[ageGroup] || 0) + 1;

    const operator = centre.operator || 'Unknown';
    byOperator[operator] = (byOperator[operator] || 0) + 1;
  }

  return {
    centres,
    total: centres.length,
    byAgeGroup,
    byOperator,
  };
}