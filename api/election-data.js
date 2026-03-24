// Election Data - Polling / Voting Locations in Toronto
// Data source: Toronto Open Data - Elections Voting Locations (2023 Mayoral By-election)
// Dataset: https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/31dac8b2-2e15-4945-abef-ce98d248bb8e
// 1,445 voting locations with addresses and coordinates

import { jsonResponse } from './_json-response.js';

var config = { runtime: "edge" };
var CACHE_KEY = "election-data";
var CACHE_TTL_SECONDS = 60 * 60; // 1 hour

async function handler(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const ward = url.searchParams.get('ward');

  try {
    // Fetch voting locations from Toronto CKAN
    const dataUrl = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/6b74ec04-0f6c-4915-8cee-6a2d924c6828';

    const response = await fetch(dataUrl, {
      headers: {
        'User-Agent': 'worldmonitor/1.0',
      },
    });

    if (!response.ok) {
      console.error('CKAN API error:', response.status, response.statusText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch election data',
        source: 'Toronto CKAN',
        status: response.status,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      });
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    // Parse CSV (skip header)
    const headers = lines[0].split(',');
    const locations = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Handle quoted fields with embedded commas
      const row = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());

      // Map columns
      if (row.length >= 18) {
        const geometry = row[17];
        let lat = null;
        let lon = null;

        // Parse GeoJSON geometry
        try {
          const geom = JSON.parse(geometry.replace(/\\"\\"/g, '"'));
          if (geom.coordinates && geom.coordinates.length >= 2) {
            lon = geom.coordinates[0];
            lat = geom.coordinates[1];
          }
        } catch (e) {
          // Skip invalid geometry
          continue;
        }

        const location = {
          id: row[1], // POINT_ID
          name: row[8] || 'Unknown', // POINT_NAME
          address: row[16] || null, // ADDRESS_FULL
          lat: lat,
          lon: lon,
          type: row[3] || 'VOTING_LOCATION', // POINT_TYPE
          featureCode: row[4] || null, // FEATURE_CODE
          voterCount: row[15] ? parseInt(row[15]) : null, // VOTER_COUNT
        };

        locations.push(location);
      }
    }

    // Filter by ward if needed (extract ward from geometry or address)
    let filtered = locations;
    if (ward) {
      filtered = locations.filter((loc) => {
        // Try to match ward from address or use spatial filtering if available
        const address = loc.address ? loc.address.toLowerCase() : '';
        return address.includes(`ward ${ward}`) ||
               address.includes(`ward${ward}`) ||
               address.includes(`${ward} ward`);
      });
    }

    // Limit results
    const limited = filtered.slice(0, limit);

    // Calculate statistics
    const withVoterCount = filtered.filter((loc) => loc.voterCount !== null);
    const totalVoterCount = withVoterCount.reduce((sum, loc) => sum + loc.voterCount, 0);

    return new Response(JSON.stringify({
      success: true,
      data: {
        locations: limited,
        statistics: {
          totalLocations: filtered.length,
          returnedLocations: limited.length,
          locationsWithVoterCount: withVoterCount.length,
          totalVoterCount: totalVoterCount,
          averageVoterCount: withVoterCount.length > 0 ? Math.round(totalVoterCount / withVoterCount.length) : null,
        },
      },
      meta: {
        source: 'Toronto Open Data - Elections Voting Locations (2023)',
        datasetUrl: 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/elections-voting-locations',
        ward: ward || 'all',
        limit: limit,
        timestamp: new Date().toISOString(),
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Election data fetch error:', error);

    // Fallback to seed data on error
    const seedData = {
      success: true,
      data: {
        locations: [
          {
            id: 'seed-1',
            name: 'Masaryk-Cowan Community Centre',
            address: '220 Cowan Ave, Toronto',
            lat: 43.640716,
            lon: -79.43323,
            type: 'VOTING_LOCATION',
            voterCount: null,
          },
          {
            id: 'seed-2',
            name: 'Dennis R. Timbrell Resource Centre',
            address: '29 St Dennis Dr, Toronto',
            lat: 43.717941,
            lon: -79.331687,
            type: 'VOTING_LOCATION',
            voterCount: null,
          },
          {
            id: 'seed-3',
            name: 'Main Square Community Centre',
            address: '245 Main St, Toronto',
            lat: 43.687164,
            lon: -79.299787,
            type: 'VOTING_LOCATION',
            voterCount: null,
          },
        ],
        statistics: {
          totalLocations: 3,
          returnedLocations: 3,
          locationsWithVoterCount: 0,
          totalVoterCount: 0,
          averageVoterCount: null,
        },
      },
      meta: {
        source: 'seed data',
        ward: ward || 'all',
        limit: limit,
        timestamp: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(seedData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    });
  }
}

export { config, handler as default };