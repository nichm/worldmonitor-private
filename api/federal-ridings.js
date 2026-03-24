/**
 * Edge function: Federal Riding Boundaries
 * Fetches federal electoral district boundaries from Elections Canada ESRI REST API
 */

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

const CACHE_TTL = 60 * 60 * 24; // 24 hours - boundaries don't change often
const ESRI_REST_URL = 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/ELECTIONS/FED_Elect2025_en/MapServer/0/query';

var config = { runtime: 'edge' };

async function handler(req) {
  try {
    const cached = await getCachedData('federal-ridings');
    if (cached) {
      return jsonResponse(cached, 200, {
        'Cache-Control': 'public, max-age=' + (CACHE_TTL / 2) + ', s-maxage=' + CACHE_TTL,
        'Access-Control-Allow-Origin': '*',
      });
    }

    // Query ESRI REST API for Toronto area ridings
    // Using a bounding box for Greater Toronto Area
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'FED_ENG_NAME,FED_NUM,PROV_TERR_CODE_ENG',
      geometry: '-79.8,43.5,-79.0,43.9',
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outSR: '4326',
      f: 'json',
    });

    const response = await fetch(`${ESRI_REST_URL}?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`ESRI API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      throw new Error('Invalid ESRI response: missing features array');
    }

    // Transform ESRI features to GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: data.features.map((feature) => ({
        type: 'Feature',
        properties: {
          name: feature.attributes.FED_ENG_NAME,
          id: feature.attributes.FED_NUM,
          province: feature.attributes.PROV_TERR_CODE_ENG,
        },
        geometry: feature.geometry,
      })),
    };

    await setCachedData('federal-ridings', geojson, CACHE_TTL);

    return jsonResponse(geojson, 200, {
      'Cache-Control': 'public, max-age=' + (CACHE_TTL / 2) + ', s-maxage=' + CACHE_TTL,
      'Access-Control-Allow-Origin': '*',
    });
  } catch (error) {
    console.error('Federal ridings fetch error:', error);
    // Return empty data on error, never 500
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