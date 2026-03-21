import { jsonResponse } from './_json-response.js';

const ONTARIO_OPEN_DATA_URL = 'https://data.ontario.ca/api/3/action/package_show?id=ontario-s-housing-supply-progress';
const RESOURCE_NAME = 'ontario_housing_supply_progress.csv';

export const config = { runtime: 'edge' };

// GTA municipalities to filter
const GTA_MUNICIPALITIES = [
  'Toronto',
  'Mississauga',
  'Brampton',
  'Markham',
  'Vaughan',
  'Oakville',
  'Burlington',
];

export default async function handler(req) {
  try {
    // First, get the package metadata to find the resource URL
    const packageResponse = await fetch(ONTARIO_OPEN_DATA_URL, {
      headers: {
        'User-Agent': 'worldmonitor.app',
      },
    });

    if (!packageResponse.ok) {
      throw new Error(`Ontario Open Data API returned ${packageResponse.status}: ${packageResponse.statusText}`);
    }

    const packageJson = await packageResponse.json();

    if (!packageJson.success || !packageJson.result || !packageJson.result.resources) {
      throw new Error('Invalid Ontario Open Data response structure');
    }

    // Find the CSV resource
    const csvResource = packageJson.result.resources.find(
      r => r.name === RESOURCE_NAME || r.url.endsWith('.csv')
    );

    if (!csvResource) {
      throw new Error('CSV resource not found in Ontario Housing package');
    }

    // Fetch the CSV data
    const csvResponse = await fetch(csvResource.url);

    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status}`);
    }

    const csvText = await csvResponse.text();

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};

      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || '';
      }

      // Filter to GTA municipalities
      if (GTA_MUNICIPALITIES.includes(row.Municipality)) {
        const target = parseFloat(row.Target) || 0;
        const housingUnits = parseFloat(row['Housing Units'] || row.Housing_Units || '0') || 0;

        data.push({
          _id: i - 1,
          Municipality: row.Municipality,
          Year: parseInt(row.Year, 10) || new Date().getFullYear(),
          Target: target,
          Housing_Units: housingUnits,
          Progress_Percentage: target > 0 ? (housingUnits / target) * 100 : 0,
        });
      }
    }

    // Sort by progress percentage descending
    data.sort((a, b) => b.Progress_Percentage - a.Progress_Percentage);

    return jsonResponse(data, 200, {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-if-error=7200',
      'Access-Control-Allow-Origin': '*',
    });

  } catch (error) {
    console.error('Ontario Housing API error:', error);
    return jsonResponse({ error: 'Failed to fetch Ontario Housing data', message: error.message }, 500, {
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-if-error=1200',
      'Access-Control-Allow-Origin': '*',
    });
  }
}
