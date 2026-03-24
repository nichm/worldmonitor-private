// Lake Ontario Level - Real-time water level data
// Data source: Canadian Hydrographic Service (CHS) - IWLS API
// Station: Toronto (13320) - Water Level Official Value (wlo)
// Location: 43.639771, -79.380286
// API: https://api-sine.dfo-mpo.gc.ca/api/v1/stations/{stationId}/data

import { jsonResponse } from './_json-response.js';

var config = { runtime: "edge" };
var CACHE_TTL = 300; // 5 minutes

async function handler(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const hours = parseInt(url.searchParams.get('hours') || '24');

  try {
    // CHS IWLS API - Toronto station (13320)
    // Station ID: 5cebf1e43d0f4a073c4bc3e5
    const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const toDate = new Date().toISOString();

    const apiUrl = `https://api-sine.dfo-mpo.gc.ca/api/v1/stations/5cebf1e43d0f4a073c4bc3e5/data?from=${fromDate}&to=${toDate}`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'worldmonitor/1.0',
      },
    });

    if (!response.ok) {
      console.error('IWLS API error:', response.status, response.statusText);
      return jsonResponse({
        success: false,
        error: 'Failed to fetch water level data',
        source: 'IWLS API',
        status: response.status,
      }, 200, {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      });
    }

    const data = await response.json();

    // Filter for water level observations (timeSeriesId: 5cebf1e43d0f4a073c4bc3e2 = wlo)
    // and quality-controlled data (qcFlagCode: 1 = Good)
    const waterLevels = data.filter(
      (reading) =>
        reading.timeSeriesId === '5cebf1e43d0f4a073c4bc3e2' &&
        reading.qcFlagCode === 1
    );

    if (!waterLevels || waterLevels.length === 0) {
      return jsonResponse({
        success: true,
        data: [],
        meta: {
          location: {
            name: 'Toronto',
            stationCode: '13320',
            lat: 43.639771,
            lon: -79.380286,
          },
          source: 'CHS IWLS API',
          hours: hours,
        },
      }, 200, {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      });
    }

    // Calculate statistics
    const levels = waterLevels.map((r) => r.value);
    const latest = levels[levels.length - 1];
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;

    // Convert to feet (1 meter = 3.28084 feet)
    const toFeet = (meters) => meters * 3.28084;

    return jsonResponse({
      success: true,
      data: {
        current: {
          meters: latest,
          feet: toFeet(latest),
          timestamp: waterLevels[waterLevels.length - 1].eventDate,
        },
        statistics: {
          min: {
            meters: min,
            feet: toFeet(min),
          },
          max: {
            meters: max,
            feet: toFeet(max),
          },
          average: {
            meters: avg,
            feet: toFeet(avg),
          },
        },
        readings: waterLevels.map((reading) => ({
          timestamp: reading.eventDate,
          meters: reading.value,
          feet: toFeet(reading.value),
          quality: reading.qcFlagCode === 1 ? 'good' : 'uncertain',
        })),
      },
      meta: {
        location: {
          name: 'Toronto',
          stationCode: '13320',
          lat: 43.639771,
          lon: -79.380286,
        },
        source: 'CHS IWLS API',
        hours: hours,
        readingCount: waterLevels.length,
      },
    }, 200, {
      'Cache-Control': 'public, max-age=' + CACHE_TTL + ', s-maxage=' + (CACHE_TTL * 2),
      'Access-Control-Allow-Origin': '*',
    });

  } catch (error) {
    console.error('Lake Ontario level fetch error:', error);

    // Fallback to seed data on error
    const seedData = {
      success: true,
      data: {
        current: {
          meters: 0.58,
          feet: 1.90,
          timestamp: new Date().toISOString(),
        },
        statistics: {
          min: { meters: 0.55, feet: 1.80 },
          max: { meters: 0.62, feet: 2.03 },
          average: { meters: 0.58, feet: 1.90 },
        },
        readings: [],
      },
      meta: {
        location: {
          name: 'Toronto (seed data)',
          lat: 43.639771,
          lon: -79.380286,
        },
        source: 'seed',
        hours: hours,
        readingCount: 0,
      },
    };

    return jsonResponse(seedData, 200, {
      'Cache-Control': 'public, max-age=60, s-maxage=120',
      'Access-Control-Allow-Origin': '*',
    });
  }
}

export { config, handler as default };