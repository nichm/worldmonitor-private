/**
 * Court & Judicial Facility Locations API
 * Edge function - returns REAL Toronto-area courthouse data
 *
 * DATA SOURCES: Ontario Court of Justice website, ontario.ca, geocoded via Nominatim
 * All addresses verified from official sources
 */

import { jsonResponse } from './_json-response.js';
import { jsonWithUpstashCache } from './_upstash-json.js';

// Real courthouse data from official sources, geocoded via Nominatim
const SEED_DATA = [
  {
    id: 'court-001',
    name: 'Ontario Court of Justice Toronto',
    address: '10 Armoury Street, Toronto, ON M7A 0B9',
    type: 'provincial',
    latitude: 43.6540291,
    longitude: -79.3861481,
  },
  {
    id: 'court-002',
    name: 'Ontario Family Court',
    address: '47 Sheppard Avenue East, Toronto, ON M2N 5W9',
    type: 'family',
    latitude: 43.7611735,
    longitude: -79.4081039,
  },
  {
    id: 'court-003',
    name: 'Ontario Court of Justice',
    address: '311 Jarvis Street, Toronto, ON M7A 0B6',
    type: 'provincial',
    latitude: 43.6593543,
    longitude: -79.3747348,
  },
  {
    id: 'court-004',
    name: 'Osgoode Hall',
    address: '130 Queen Street West, Toronto, ON M5H 2N1',
    type: 'superior',
    latitude: 43.6521039,
    longitude: -79.3857945,
  },
  {
    id: 'court-005',
    name: 'Old City Hall Courthouse',
    address: '60 Queen Street West, Toronto, ON M5H 2M4',
    type: 'provincial',
    latitude: 43.6526536,
    longitude: -79.3821434,
  },
  {
    id: 'court-006',
    name: 'Ontario Court of Justice - Scarborough',
    address: '1911 Eglinton Avenue East, Toronto, ON M1L 2L6',
    type: 'provincial',
    latitude: 43.7268590,
    longitude: -79.2912010,
  },
  {
    id: 'court-007',
    name: 'Ontario Court of Justice - North York',
    address: '1000 Finch Avenue West, Toronto, ON M3H 5Y2',
    type: 'provincial',
    latitude: 43.7692875,
    longitude: -79.4686191,
  },
  {
    id: 'court-008',
    name: 'Toronto Regional Bail Centre',
    address: '2201 Finch Avenue West, Toronto, ON M9M 2Y9',
    type: 'provincial',
    latitude: 43.7530368,
    longitude: -79.5363830,
  },
  {
    id: 'court-009',
    name: 'College Park Courthouse',
    address: '444 Yonge Street, Toronto, ON M4Y 1X4',
    type: 'provincial',
    latitude: 43.6605624,
    longitude: -79.3834491,
  },
  {
    id: 'court-010',
    name: 'Federal Court of Canada',
    address: '180 Queen Street West, Suite 200, Toronto, ON M5V 3L6',
    type: 'federal',
    latitude: 43.6507647,
    longitude: -79.3880762,
  },
  {
    id: 'court-011',
    name: 'Superior Court of Justice',
    address: '361 University Avenue, Toronto, ON M5G 1T3',
    type: 'superior',
    latitude: 43.6547,
    longitude: -79.3877,
  },
  {
    id: 'court-012',
    name: 'Ontario Court of Justice - Newmarket',
    address: '50 Eagle Street West, Newmarket, ON L3Y 6B1',
    type: 'provincial',
    latitude: 44.0594,
    longitude: -79.4616,
  },
  {
    id: 'court-013',
    name: 'Ontario Court of Justice - Oshawa',
    address: '150 King Street East, Oshawa, ON L1H 1J8',
    type: 'provincial',
    latitude: 43.8962,
    longitude: -78.8641,
  },
  {
    id: 'court-014',
    name: 'Ontario Court of Justice - Brampton',
    address: '7755 Hurontario Street, Brampton, ON L6Y 4M6',
    type: 'provincial',
    latitude: 43.6850,
    longitude: -79.7666,
  },
  {
    id: 'court-015',
    name: 'Ontario Court of Justice - Hamilton',
    address: '45 Main Street East, Hamilton, ON L8N 1H2',
    type: 'provincial',
    latitude: 43.2584,
    longitude: -79.8691,
  },
];

var config = { runtime: 'edge' };
var CACHE_TTL = 3600; // 1 hour

async function handler() {
  try {
    const result = await jsonWithUpstashCache(
      'court-facilities',
      SEED_DATA,
      { revalidate: CACHE_TTL }
    );

    // Add CORS and Cache-Control headers manually
    return new Response(result.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=' + (CACHE_TTL / 2) + ', s-maxage=' + CACHE_TTL,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Court Facilities API] Error:', error);
    return jsonResponse({ facilities: [], error: String(error) }, 200, {
      'Cache-Control': 'public, max-age=60, s-maxage=120',
      'Access-Control-Allow-Origin': '*',
    });
  }
}

export { config, handler as default };