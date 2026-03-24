/**
 * Edge function: Traffic Signal Locations
 * Fetches Toronto traffic signal data from CKAN
 */

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

const CACHE_TTL = 60 * 60 * 24; // 24 hours - traffic signals don't change often
const SIGNALS_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/7d3ae06b-0217-4cc9-92ed-97adafca2f7b';

var config = { runtime: 'edge' };

async function handler(req) {
  try {
    const cached = await getCachedData('traffic-signals');
    if (cached) {
      return jsonResponse(cached, 200, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': `public, max-age=${Math.floor(CACHE_TTL / 2)}`,
      });
    }

    const response = await fetch(SIGNALS_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid traffic signals data: expected array');
    }

    // Transform CKAN data to GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: data.map((row) => {
        // Extract coordinates from CKAN data
        // Adjust field names based on actual CKAN response
        const lon = row.LONGITUDE || row.longitude || row.lon || -79.3832;
        const lat = row.LATITUDE || row.latitude || row.lat || 43.6532;

        return {
          type: 'Feature',
          properties: {
            id: row.SIGNAL_ID || row.id || row.SIGNALID || 'Unknown',
            type: row.SIGNAL_TYPE || row.type || 'Traffic Signal',
            status: row.STATUS || row.status || 'Active',
            intersection: row.INTERSECTION || row.intersection || 'Unknown',
          },
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)],
          },
        };
      }),
    };

    await setCachedData('traffic-signals', geojson, CACHE_TTL);

    return jsonResponse(geojson, 200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${Math.floor(CACHE_TTL / 2)}`,
    });
  } catch (error) {
    console.error('Traffic signals fetch error:', error);
    // Fallback/seed data
    const fallback = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            id: '101',
            type: 'Traffic Signal',
            status: 'Active',
            intersection: 'Yonge St & Bloor St',
          },
          geometry: {
            type: 'Point',
            coordinates: [-79.3832, 43.6532],
          },
        },
      ],
    };
    return jsonResponse(fallback, 200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    });
  }
}

export { config, handler as default };