/**
 * Edge function: Toronto Hydro Power Outages
 *
 * STATUS: NO REAL DATA SOURCE AVAILABLE
 * ----------------------------------------
 * Toronto Hydro does not provide a public API for outage data.
 * The outage map at https://outagemap.torontohydro.com/ is a client-side
 * JavaScript application with no accessible API endpoints.
 *
 * Research findings:
 * - No public API endpoints found
 * - IESO (Independent Electricity System Operator) has generator outage data,
 *   but not localized customer outage data
 * - No scrapers or reverse-engineered APIs found on GitHub
 * - The outage map page loads data dynamically via JavaScript, making web
 *   scraping brittle and maintenance-heavy
 *
 * Alternative options considered:
 * - Web scraping with Puppeteer (like Toronto Fire): Too brittle, high
 *   maintenance, likely to break frequently
 * - IESO data: Only generator outages, not customer outages
 * - Third-party aggregators: None found
 *
 * Current approach: Seed data with documentation
 * - Returns static seed data for API compatibility
 * - Clearly marked as placeholder data
 * - No false claims about live data
 *
 * If a real data source becomes available:
 * 1. Update this handler to fetch from the real source
 * 2. Remove this documentation block
 * 3. Update cache TTL appropriately
 */

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

const CACHE_TTL = 60 * 5; // 5 minutes - even though data is static, keep short TTL for cache freshness

// Seed data for Toronto Hydro outages (placeholder only)
// NOTE: This is NOT real data - it's for API compatibility only
const SEED_DATA = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'TH-001',
        severity: 'major',
        affected_customers: 1500,
        status: 'active',
        estimated_restoration: '2026-03-24 15:00 EDT',
        cause: 'Equipment failure',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.3832, 43.6532],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'TH-002',
        severity: 'minor',
        affected_customers: 50,
        status: 'active',
        estimated_restoration: '2026-03-24 13:00 EDT',
        cause: 'Weather',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.4066, 43.6476],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'TH-003',
        severity: 'major',
        affected_customers: 800,
        status: 'investigating',
        estimated_restoration: 'TBD',
        cause: 'Unknown',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.3824, 43.6567],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'TH-004',
        severity: 'minor',
        affected_customers: 25,
        status: 'active',
        estimated_restoration: '2026-03-24 12:30 EDT',
        cause: 'Planned maintenance',
      },
      geometry: {
        type: 'Point',
        coordinates: [-79.4022, 43.6529],
      },
    },
  ],
  metadata: {
    dataSource: 'Seed data (placeholder)',
    note: 'Toronto Hydro does not provide a public API for outage data. This is placeholder data for API compatibility.',
    realSource: 'None available - outage map at https://outagemap.torontohydro.com/ has no accessible API',
    lastChecked: new Date().toISOString()
  }
};

var config = { runtime: 'edge' };

async function handler(req) {
  try {
    const cached = await getCachedData('toronto-hydro-outages');
    if (cached) {
      return jsonResponse(cached, 200, {
        'Cache-Control': 'public, max-age=' + (CACHE_TTL / 2) + ', s-maxage=' + CACHE_TTL,
        'Access-Control-Allow-Origin': '*',
      });
    }

    // Return seed data (no real data source available)
    await setCachedData('toronto-hydro-outages', SEED_DATA, CACHE_TTL);

    return jsonResponse(SEED_DATA, 200, {
      'Cache-Control': 'public, max-age=' + (CACHE_TTL / 2) + ', s-maxage=' + CACHE_TTL,
      'Access-Control-Allow-Origin': '*',
    });
  } catch (error) {
    console.error('Toronto Hydro outages fetch error:', error);
    return jsonResponse({
      type: 'FeatureCollection',
      features: [],
      error: error.message,
      metadata: {
        dataSource: 'Seed data (placeholder)',
        note: 'Toronto Hydro does not provide a public API for outage data.'
      }
    }, 200, {
      'Cache-Control': 'public, max-age=60, s-maxage=120',
      'Access-Control-Allow-Origin': '*',
    });
  }
}

export { config, handler as default };