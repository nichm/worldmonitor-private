/**
 * Toronto Schools Configuration
 * Source: Toronto Open Data CKAN API
 */

export interface School {
  id: string;
  name: string;
  schoolLevel: string;
  schoolType: string;
  boardName: string;
  address: string;
  postalCode: string;
  lat: number;
  lon: number;
}

export interface SchoolsData {
  schools: School[];
  total: number;
  boardCounts: Record<string, number>;
  typeCounts: Record<string, number>;
}

/** Gets color for a school board */
export function getSchoolColor(boardName: string): string {
  const key = getSchoolBoardKey(boardName);
  switch (key) {
    case 'TDSB':
      return '#3b82f6'; // blue
    case 'TCDSB':
      return '#10b981'; // green
    case 'Private':
      return '#8b5cf6'; // purple
    case 'French':
      return '#f97316'; // orange
    default:
      return '#6b7280'; // gray
  }
}

/** Gets normalized board label */
export function getSchoolBoardLabel(boardName: string): string {
  if (!boardName || boardName === 'None') {
    return 'Other';
  }

  const key = getSchoolBoardKey(boardName);
  switch (key) {
    case 'TDSB':
      return 'TDSB';
    case 'TCDSB':
      return 'TCDSB';
    case 'Private':
      return 'Private';
    case 'French':
      return 'French';
    default:
      return boardName;
  }
}

/** Gets display size for a school based on level */
export function getSchoolSize(schoolLevel: string): number {
  if (!schoolLevel) return 7;

  const normalized = schoolLevel.toLowerCase();
  if (normalized.includes('elementary')) {
    return 6;
  } else if (normalized.includes('secondary')) {
    return 10;
  } else {
    return 7; // Default/unknown
  }
}

/** Categorizes board name into standard keys */
export function getSchoolBoardKey(boardName: string | null): string {
  if (!boardName || boardName === 'None') {
    return 'Other';
  }

  const normalized = boardName.toLowerCase();

  if (normalized.includes('toronto district school board') || normalized.includes('tdsb')) {
    return 'TDSB';
  } else if (normalized.includes('toronto catholic district school board') || normalized.includes('tcdsb')) {
    return 'TCDSB';
  } else if (normalized.includes('private')) {
    return 'Private';
  } else if (
    normalized.includes('viamonde') ||
    normalized.includes('centre-sud') ||
    normalized.includes('conseil scolaire') ||
    normalized.includes('french')
  ) {
    return 'French';
  } else {
    return 'Other';
  }
}