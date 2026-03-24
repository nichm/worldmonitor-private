/**
 * Schools service — fetches Toronto school locations via Edge Function
 */
import { getRpcBaseUrl } from '@/services/rpc-client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import type { School, SchoolsData } from '@/config/schools';

const SCHOOLS_API_URL = '/api/schools';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (monthly)

const breaker = createCircuitBreaker<SchoolsData>({
  name: 'TorontoSchools',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

const emptyFallback: SchoolsData = { schools: [], total: 0, boardCounts: {}, typeCounts: {} };

/**
 * Parses CSV line, handling quoted fields properly
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  // Add the last field
  fields.push(current.trim());

  return fields;
}

/**
 * Extracts coordinates from geometry JSON string
 */
function parseGeometry(geometryStr: string): { lat: number; lon: number } | null {
  try {
    const geometry = JSON.parse(geometryStr);
    if (geometry.type === 'Point' && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
      // GeoJSON uses [lon, lat] order
      return {
        lon: geometry.coordinates[0],
        lat: geometry.coordinates[1],
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches school locations from Toronto Open Data CKAN API
 */
export async function fetchSchools(): Promise<SchoolsData> {
  // Try hydrated data first
  const hydrated = getHydratedData('schools') as SchoolsData | undefined;
  if (hydrated && hydrated.schools.length > 0) return hydrated;

  const response = await breaker.execute(async () => {
    const url = `${getRpcBaseUrl()}${SCHOOLS_API_URL}`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const csvText = await resp.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    // Skip header row
    const header = parseCsvLine(lines[0]);
    const idIndex = header.findIndex(h => h === '_id');
    const nameIndex = header.findIndex(h => h === 'NAME');
    const schoolLevelIndex = header.findIndex(h => h === 'SCHOOL_LEVEL');
    const schoolTypeIndex = header.findIndex(h => h === 'SCHOOL_TYPE');
    const boardNameIndex = header.findIndex(h => h === 'BOARD_NAME');
    const addressIndex = header.findIndex(h => h === 'ADDRESS_FULL');
    const postalCodeIndex = header.findIndex(h => h === 'POSTAL_CODE');
    const geometryIndex = header.findIndex(h => h === 'geometry');

    const schools: School[] = [];
    const boardCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCsvLine(lines[i]);

      if (fields.length < header.length) continue;

      const id = idIndex >= 0 ? fields[idIndex] : `school-${i}`;
      const name = nameIndex >= 0 ? fields[nameIndex] : '';
      const schoolLevel = schoolLevelIndex >= 0 ? fields[schoolLevelIndex] : 'None';
      const schoolType = schoolTypeIndex >= 0 ? fields[schoolTypeIndex] : 'None';
      const boardName = boardNameIndex >= 0 ? fields[boardNameIndex] : 'None';
      const address = addressIndex >= 0 ? fields[addressIndex] : '';
      const postalCode = postalCodeIndex >= 0 ? fields[postalCodeIndex] : '';
      const geometryStr = geometryIndex >= 0 ? fields[geometryIndex] : '';

      const coords = parseGeometry(geometryStr);
      if (!coords || coords.lat === 0 || coords.lon === 0) continue;

      const school: School = {
        id,
        name,
        schoolLevel,
        schoolType,
        boardName,
        address,
        postalCode,
        lat: coords.lat,
        lon: coords.lon,
      };

      schools.push(school);

      // Count by board
      const boardKey = getSchoolBoardKey(boardName);
      boardCounts[boardKey] = (boardCounts[boardKey] || 0) + 1;

      // Count by type
      if (schoolType && schoolType !== 'None') {
        typeCounts[schoolType] = (typeCounts[schoolType] || 0) + 1;
      }
    }

    return {
      schools,
      total: schools.length,
      boardCounts,
      typeCounts,
    };
  }, emptyFallback);

  return response;
}