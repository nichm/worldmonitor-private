/**
 * Edge function: Neighbourhood Profiles & Demographics
 * Fetches Toronto neighbourhood boundaries from CKAN
 */

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

const CACHE_TTL = 60 * 60 * 24; // 24 hours - boundaries don't change often
const NEIGHBOURHOODS_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/fc443770-ef0a-4025-9c2c-2cb558bfab00/resource/0719053b-28b7-48ea-b863-068823a93aaa/download/neighbourhoods-4326.geojson';

var config = { runtime: 'edge' };

async function handler(req) {
  try {
    const cached = await getCachedData('neighbourhoods');
    if (cached) {
      return jsonResponse(cached, 200, {
        'Cache-Control': 'public, max-age=' + (CACHE_TTL / 2) + ', s-maxage=' + CACHE_TTL,
        'Access-Control-Allow-Origin': '*',
      });
    }

    const response = await fetch(NEIGHBOURHOODS_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status}`);
    }

    const geojson = await response.json();

    if (!geojson.features || !Array.isArray(geojson.features)) {
      throw new Error('Invalid neighbourhoods data: missing features array');
    }

    await setCachedData('neighbourhoods', geojson, CACHE_TTL);

    return jsonResponse(geojson, 200, {
      'Cache-Control': 'public, max-age=' + (CACHE_TTL / 2) + ', s-maxage=' + CACHE_TTL,
      'Access-Control-Allow-Origin': '*',
    });
  } catch (error) {
    console.error('Neighbourhoods fetch error:', error);
    return jsonResponse({
      type: 'FeatureCollection',
      features: [],
      error: error.message,
    }, 200, {
      'Cache-Control': 'public, max-age=60, s-maxage=120',
      'Access-Control-Allow-Origin': '*',
    });
  }
}

export { config, handler as default };