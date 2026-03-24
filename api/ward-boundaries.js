/**
 * Edge function: Council Votes & Ward Boundaries
 * Fetches Toronto ward boundaries from CKAN
 *
 * TODO: Add council voting records data source
 */

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

const CACHE_TTL = 60 * 60 * 24; // 24 hours - boundaries don't change often
const WARDS_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/5e7a8234-f805-43ac-820f-03d7c360b588/resource/737b29e0-8329-4260-b6af-21555ab24f28/download/city-wards-data-4326.geojson';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const cached = await getCachedData('ward-boundaries');
    if (cached) {
      return jsonResponse(cached, 200, {
        "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=3600`,
        "Access-Control-Allow-Origin": "*"
      });
    }

    const response = await fetch(WARDS_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status}`);
    }

    const geojson = await response.json();

    if (!geojson.features || !Array.isArray(geojson.features)) {
      throw new Error('Invalid ward boundaries data: missing features array');
    }

    await setCachedData('ward-boundaries', geojson, CACHE_TTL);

    return jsonResponse(geojson, 200, {
      "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=3600`,
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error('Ward boundaries fetch error:', error);
    return jsonResponse({
      type: 'FeatureCollection',
      features: [],
      error: error.message,
    }, 200, {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*"
    });
  }
}