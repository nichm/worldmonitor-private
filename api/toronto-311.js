import { jsonResponse } from './_json-response.js';

const CKAN_BASE_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca';
const DATASET_ID = 'service-request-data-2014-2018'; // This is the CKAN resource ID

// High-signal service request types for housing and social distress
const HIGH_SIGNAL_TYPES = [
  'Shelter or Housing Crisis',
  'Needle and Syringe Drop Box Full',
  'Encampment Report',
  'Affordable Housing Request',
  'Noise - Residential',  // Additional high-frequency complaint
];

const TODAY = new Date();
const SEVEN_DAYS_AGO = new Date(TODAY.getTime() - 7 * 24 * 60 * 60 * 1000);

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    // Build CKAN datastore SQL query for last 7 days of high-signal types
    const typeList = HIGH_SIGNAL_TYPES.map(t => `'${t}'`).join(', ');

    const query = {
      resource_id: DATASET_ID,
      sql: `
        SELECT
          SERVICE_REQUEST_TYPE,
          WARD,
          STATUS,
          CREATED_DATE,
          CLOSED_DATE,
          REQUEST_SOURCE,
          LATITUDE,
          LONGITUDE
        FROM "${DATASET_ID}"
        WHERE SERVICE_REQUEST_TYPE IN (${typeList})
          AND CREATED_DATE >= '${formatDate(SEVEN_DAYS_AGO)}'
        ORDER BY CREATED_DATE DESC
        LIMIT 5000
      `.trim().replace(/\s+/g, ' ')
    };

    const url = `${CKAN_BASE_URL}/api/action/datastore_sql?q=${encodeURIComponent(query.sql)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'worldmonitor.app',
      },
      signal: AbortSignal.timeout(20000), // 20 second timeout
    });

    if (!response.ok) {
      throw new Error(`CKAN API returned ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.success || !json.result || !json.result.records) {
      throw new Error('Invalid CKAN response structure');
    }

    const records = json.result.records;

    // Aggregate by ward and service type
    const wardStats = {};

    const recordsWithLocation = [];

    for (const record of records) {
      const ward = record.WARD || 'Unknown';
      const type = record.SERVICE_REQUEST_TYPE || 'Unknown';
      const status = record.STATUS || 'Unknown';
      const created = new Date(record.CREATED_DATE);
      const closed = record.CLOSED_DATE ? new Date(record.CLOSED_DATE) : null;

      if (!wardStats[ward]) {
        wardStats[ward] = {
          ward,
          totalCount: 0,
          byType: {},
          openCount: 0,
          withLocation: 0,
        };
      }

      wardStats[ward].totalCount++;
      wardStats[ward].byType[type] = (wardStats[ward].byType[type] || 0) + 1;

      if (status.toLowerCase() === 'open') {
        wardStats[ward].openCount++;
      }

      if (record.LATITUDE && record.LONGITUDE) {
        wardStats[ward].withLocation++;
        recordsWithLocation.push({
          type,
          ward,
          status,
          lat: parseFloat(record.LATITUDE),
          lon: parseFloat(record.LONGITUDE),
          created_date: record.CREATED_DATE,
        });
      }

      // Calculate response time for closed requests
      if (closed && ward) {
        const responseHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
        if (!wardStats[ward].avgResponseTime) {
          wardStats[ward].avgResponseTime = responseHours;
        } else {
          // Simple moving average
          wardStats[ward].avgResponseTime =
            (wardStats[ward].avgResponseTime + responseHours) / 2;
        }
      }
    }

    // Calculate stress scores per ward
    const maxTotal = Math.max(...Object.values(wardStats).map(s => s.totalCount), 1);
    const maxOpen = Math.max(...Object.values(wardStats).map(s => s.openCount), 1);

    const wardStressScores = Object.values(wardStats).map(stat => {
      // Stress score combines:
      // - Total requests (normalized 0-1, weight 0.5)
      // - Open requests (normalized 0-1, weight 0.3)
      // - Response time (normalized, weight 0.2)
      const volumeScore = stat.totalCount / maxTotal;
      const openScore = stat.openCount / maxOpen;
      const responseScore = stat.avgResponseTime
        ? Math.min(stat.avgResponseTime / 168, 1) // Cap at 1 week (168 hours)
        : 0;

      const stressScore = (volumeScore * 0.5) + (openScore * 0.3) + (responseScore * 0.2);

      return {
        ward: stat.ward,
        total_requests: stat.totalCount,
        open_requests: stat.openCount,
        by_type: stat.byType,
        with_location: stat.withLocation,
        avg_response_time_hours: stat.avgResponseTime?.toFixed(1) || null,
        stress_score: Math.round(stressScore * 100) / 100,
        stress_level: stressScore > 0.7 ? 'high' : stressScore > 0.4 ? 'medium' : 'low',
      };
    });

    // Sort by stress score descending
    wardStressScores.sort((a, b) => b.stress_score - a.stress_score);

    // Aggregate city-wide stats
    const cityTotal = records.length;
    const cityOpen = records.filter(r => r.STATUS?.toLowerCase() === 'open').length;
    const topWards = wardStressScores.slice(0, 5);

    return jsonResponse({
      city_stats: {
        total_requests: cityTotal,
        open_requests: cityOpen,
        period_days: 7,
      },
      ward_stress_scores: wardStressScores,
      top_wards: topWards,
      records: recordsWithLocation.slice(0, 500), // Limit to 500 records for map layer
      fetched_at: new Date().toISOString(),
    }, 200, {
      'Cache-Control': 'public, max-age=21600, s-maxage=21600, stale-if-error=43200', // 6 hours
      'Access-Control-Allow-Origin': '*',
    });

  } catch (error) {
    console.error('311 API error:', error);
    return jsonResponse({ error: 'Failed to fetch 311 data', message: error.message }, 500, {
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-if-error=1200',
      'Access-Control-Allow-Origin': '*',
    });
  }
}