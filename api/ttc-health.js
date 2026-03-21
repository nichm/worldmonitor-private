import { jsonResponse } from './_json-response.js';

const CKAN_BASE_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca';

// TTC delay datasets (CKAN resource IDs)
const TTC_DATASETS = {
  bus: 'ttc-bus-delay-data',
  streetcar: 'ttc-streetcar-delay-data',
  subway: 'ttc-subway-delay-data',
};

const DAYS_TO_QUERY = 30;
const TODAY = new Date();
const THIRTY_DAYS_AGO = new Date(TODAY.getTime() - DAYS_TO_QUERY * 24 * 60 * 60 * 1000);

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    // Fetch data from all three TTC delay datasets
    const [busData, streetcarData, subwayData] = await Promise.all([
      fetchTtcDelayData(TTC_DATASETS.bus, 'bus'),
      fetchTtcDelayData(TTC_DATASETS.streetcar, 'streetcar'),
      fetchTtcDelayData(TTC_DATASETS.subway, 'subway'),
    ]);

    // Aggregate metrics
    const summary = {
      bus: calculateDelayMetrics(busData),
      streetcar: calculateDelayMetrics(streetcarData),
      subway: calculateDelayMetrics(subwayData),
    };

    // Calculate overall system health
    const healthScore = calculateSystemHealth(summary);

    return jsonResponse({
      summary,
      health_score: healthScore,
      period_days: DAYS_TO_QUERY,
      fetched_at: new Date().toISOString(),
    }, 200, {
      'Cache-Control': 'public, max-age=43200, s-maxage=43200, stale-if-error=86400', // 12 hours
      'Access-Control-Allow-Origin': '*',
    });

  } catch (error) {
    console.error('TTC Health API error:', error);
    return jsonResponse({ error: 'Failed to fetch TTC health data', message: error.message }, 500, {
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-if-error=1200',
      'Access-Control-Allow-Origin': '*',
    });
  }
}

async function fetchTtcDelayData(resourceId, mode) {
  try {
    // Try datastore search first (for recent data)
    const url = `${CKAN_BASE_URL}/api/action/datastore_search?resource_id=${resourceId}&limit=5000`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'worldmonitor.app',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${mode} data: ${response.status}`);
      return [];
    }

    const json = await response.json();

    if (!json.success || !json.result || !json.result.records) {
      return [];
    }

    // Filter records to last 30 days
    const records = json.result.records.filter((record: any) => {
      const dateStr = record.Report_Date || record.date;
      if (!dateStr) return false;

      const date = new Date(dateStr);
      return date >= THIRTY_DAYS_AGO && date <= TODAY;
    });

    return records;

  } catch (error) {
    console.warn(`Error fetching ${mode} data:`, error);
    return [];
  }
}

function calculateDelayMetrics(records) {
  if (!records || records.length === 0) {
    return {
      total_incidents: 0,
      avg_delay_minutes: null,
      p50_delay_minutes: null,
      p95_delay_minutes: null,
      max_delay_minutes: null,
      health_color: 'green',
    };
  }

  // Extract delay values (try multiple field names)
  const delays: number[] = [];

  for (const record of records) {
    const delay = record.Min_Delay || record.delay || record.Min || record.min_delay;
    if (delay !== null && delay !== undefined && !isNaN(delay)) {
      delays.push(parseFloat(delay));
    }
  }

  if (delays.length === 0) {
    return {
      total_incidents: records.length,
      avg_delay_minutes: null,
      p50_delay_minutes: null,
      p95_delay_minutes: null,
      max_delay_minutes: null,
      health_color: 'green',
    };
  }

  // Sort for percentile calculations
  delays.sort((a, b) => a - b);

  const total = records.length;
  const avg = delays.reduce((sum, d) => sum + d, 0) / delays.length;
  const p50 = delays[Math.floor(delays.length * 0.5)];
  const p95 = delays[Math.floor(delays.length * 0.95)];
  const max = delays[delays.length - 1];

  // Determine health color based on average delay
  let healthColor: 'green' | 'amber' | 'red';
  if (avg < 3) {
    healthColor = 'green';
  } else if (avg < 8) {
    healthColor = 'amber';
  } else {
    healthColor = 'red';
  }

  return {
    total_incidents: total,
    avg_delay_minutes: Math.round(avg * 10) / 10,
    p50_delay_minutes: Math.round(p50 * 10) / 10,
    p95_delay_minutes: Math.round(p95 * 10) / 10,
    max_delay_minutes: Math.round(max * 10) / 10,
    health_color: healthColor,
  };
}

function calculateSystemHealth(summary: {
  bus: any;
  streetcar: any;
  subway: any;
}): {
  overall_color: 'green' | 'amber' | 'red';
  total_incidents: number;
  weighted_avg_delay: number | null;
} {
  const bus = summary.bus;
  const streetcar = summary.streetcar;
  const subway = summary.subway;

  const totalIncidents = bus.total_incidents + streetcar.total_incidents + subway.total_incidents;

  // Weighted average delay (weighted by incident count)
  let weightedAvg: number | null = null;

  const validDelays = [
    { count: bus.total_incidents, avg: bus.avg_delay_minutes },
    { count: streetcar.total_incidents, avg: streetcar.avg_delay_minutes },
    { count: subway.total_incidents, avg: subway.avg_delay_minutes },
  ].filter(d => d.count > 0 && d.avg !== null);

  if (validDelays.length > 0) {
    const totalWeight = validDelays.reduce((sum, d) => sum + d.count, 0);
    weightedAvg = validDelays.reduce((sum, d) => sum + d.count * (d.avg || 0), 0) / totalWeight;
  }

  // Determine overall color (most severe color wins)
  const colors = [bus.health_color, streetcar.health_color, subway.health_color];
  let overallColor: 'green' | 'amber' | 'red' = 'green';

  if (colors.includes('red')) {
    overallColor = 'red';
  } else if (colors.includes('amber')) {
    overallColor = 'amber';
  }

  return {
    overall_color: overallColor,
    total_incidents: totalIncidents,
    weighted_avg_delay: weightedAvg ? Math.round(weightedAvg * 10) / 10 : null,
  };
}