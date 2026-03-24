/**
 * Edge function: ML&S Investigation Activity
 * Fetches Municipal Licensing & Standards investigation data
 *
 * TODO: Find actual CKAN data source for ML&S investigations
 * Currently using seed data
 */

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

const CACHE_TTL = 60 * 60 * 6; // 6 hours

// Seed data for ML&S investigations (placeholder)
const SEED_DATA = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'MLS-001',
        type: 'Property Standards',
        status: 'Active',
        date: '2026-03-20',
        address: '123 Main St',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.3832, 43.6532],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'MLS-002',
        type: 'Noise Complaint',
        status: 'Resolved',
        date: '2026-03-18',
        address: '456 Queen St W',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.4066, 43.6476],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'MLS-003',
        type: 'Zoning',
        status: 'Under Review',
        date: '2026-03-22',
        address: '789 Yonge St',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.3824, 43.6567],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'MLS-004',
        type: 'Property Standards',
        status: 'Active',
        date: '2026-03-21',
        address: '321 Dundas St W',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.4022, 43.6529],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'MLS-005',
        type: 'Noise Complaint',
        status: 'Resolved',
        date: '2026-03-19',
        address: '654 Bloor St W',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.4098, 43.6603],
      },
    },
  ],
};

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const cached = await getCachedData('mls-investigations');
    if (cached) {
      return jsonResponse(cached, 200, {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=300"
      });
    }

    // TODO: Fetch actual ML&S investigation data from Toronto CKAN
    // Search for: municipal licensing and standards investigation datasets
    // Expected API: CKAN datastore with investigation locations and types

    // Using seed data for now
    await setCachedData('mls-investigations', SEED_DATA, CACHE_TTL);

    return jsonResponse(SEED_DATA, 200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=300"
    });
  } catch (error) {
    console.error('ML&S investigations fetch error:', error);
    return jsonResponse({
      type: 'FeatureCollection',
      features: [],
      error: error.message,
    }, 200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    });
  }
}