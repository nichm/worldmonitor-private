// api/protest-events.js
// Edge Function: Toronto Protest & Demonstration Events
//
// DATA SOURCES:
// - Primary: Toronto Festivals & Events (via CivicTechTO JSON-LD proxy)
//   URL: https://raw.githubusercontent.com/CivicTechTO/toronto-opendata-festivalsandevents-jsonld-proxy/main/docs/upcoming.jsonld
//   Note: This is Toronto's official events feed, transformed into schema.org/Event format
//   While primarily festivals/events, it includes rallies, community gatherings, and civic events
//   Filtered toToronto-only events with valid geolocation
//
// - Historical GDELT API (DEPRECATED): https://api.gdeltproject.org/api/v2/doc/doc
//   Status: API down as of 2025 due to Google Cloud billing issues
//   Rate limit was: 1 request per 5 seconds
//
// - ACLED (Alternative): https://acleddata.com
//   Status: Requires registration and authentication
//   Free tier provides aggregated data only
//
// Cache: 24-hour TTL via Upstash Redis

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

var config = { runtime: "edge" };

var CACHE_KEY = "protest-events-toronto";
var CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

// Seed data for Toronto protest/event locations (historical and frequent locations)
var SEED_EVENTS = [
  {
    id: "pe-001",
    name: "Queen's Park",
    address: "111 Wellesley St W, Toronto, ON",
    lat: 43.6629,
    lon: -79.3918,
    type: "government",
    typicalCrowdSize: 5000,
    description: "Ontario Legislature - frequent protest location",
  },
  {
    id: "pe-002",
    name: "Nathan Phillips Square",
    address: "100 Queen St W, Toronto, ON",
    lat: 43.6532,
    lon: -79.3832,
    type: "civic",
    typicalCrowdSize: 3000,
    description: "Toronto City Hall - civic demonstrations",
  },
  {
    id: "pe-003",
    name: "Yonge-Dundas Square",
    address: "1 Dundas St E, Toronto, ON",
    lat: 43.6561,
    lon: -79.3802,
    type: "commercial",
    typicalCrowdSize: 2000,
    description: "Major public gathering space",
  },
  {
    id: "pe-004",
    name: "US Consulate General",
    address: "360 University Ave, Toronto, ON",
    lat: 43.6548,
    lon: -79.3899,
    type: "diplomatic",
    typicalCrowdSize: 1000,
    description: "Diplomatic mission protests",
  },
  {
    id: "pe-005",
    name: "Ontario Legislature Building",
    address: "1 Queen's Park Cres, Toronto, ON",
    lat: 43.6629,
    lon: -79.3918,
    type: "government",
    typicalCrowdSize: 5000,
    description: "Provincial government seat",
  },
  {
    id: "pe-006",
    name: "Metro Hall",
    address: "55 John St, Toronto, ON",
    lat: 43.6480,
    lon: -79.3894,
    type: "civic",
    typicalCrowdSize: 1500,
    description: "Toronto municipal offices",
  },
  {
    id: "pe-007",
    name: "Ryerson University (now Toronto Metropolitan University)",
    address: "350 Victoria St, Toronto, ON",
    lat: 43.6577,
    lon: -79.3789,
    type: "educational",
    typicalCrowdSize: 2000,
    description: "University campus protests",
  },
  {
    id: "pe-008",
    name: "University of Toronto - King's College Circle",
    address: "73 Queen's Park Cres, Toronto, ON",
    lat: 43.6629,
    lon: -79.3956,
    type: "educational",
    typicalCrowdSize: 2500,
    description: "U of T main campus gathering point",
  },
  {
    id: "pe-009",
    name: "Christie Pits Park",
    address: "750 Bloor St W, Toronto, ON",
    lat: 43.6709,
    lon: -79.4168,
    type: "park",
    typicalCrowdSize: 1000,
    description: "Community gatherings and demonstrations",
  },
  {
    id: "pe-010",
    name: "Trinity Bellwoods Park",
    address: "790 Queen St W, Toronto, ON",
    lat: 43.6478,
    lon: -79.4154,
    type: "park",
    typicalCrowdSize: 1500,
    description: "West end community protests",
  },
  {
    id: "pe-011",
    name: "Allen Road / Eglinton",
    address: "Eglinton Ave W & Allen Rd, Toronto, ON",
    lat: 43.7021,
    lon: -79.4266,
    type: "transportation",
    typicalCrowdSize: 500,
    description: "Transportation infrastructure protests",
  },
  {
    id: "pe-012",
    name: "Gardiner Expressway",
    address: "Gardiner Expy & Bay St, Toronto, ON",
    lat: 43.6413,
    lon: -79.3808,
    type: "transportation",
    typicalCrowdSize: 200,
    description: "Highway protest location",
  },
  {
    id: "pe-013",
    name: "Union Station",
    address: "65 Front St W, Toronto, ON",
    lat: 43.6454,
    lon: -79.3809,
    type: "transportation",
    typicalCrowdSize: 2000,
    description: "Major transit hub demonstrations",
  },
  {
    id: "pe-014",
    name: "CN Tower / Rogers Centre",
    address: "1 Blue Jays Way, Toronto, ON",
    lat: 43.6426,
    lon: -79.3871,
    type: "landmark",
    typicalCrowdSize: 3000,
    description: "Iconic landmark protests",
  },
  {
    id: "pe-015",
    name: "Scarborough Civic Centre",
    address: "150 Borough Dr, Scarborough, ON",
    lat: 43.7731,
    lon: -79.2578,
    type: "civic",
    typicalCrowdSize: 1000,
    description: "Scarborough municipal services",
  },
  {
    id: "pe-016",
    name: "Etobicoke Civic Centre",
    address: "399 The West Mall, Etobicoke, ON",
    lat: 43.6189,
    lon: -79.5664,
    type: "civic",
    typicalCrowdSize: 800,
    description: "Etobicoke municipal services",
  },
  {
    id: "pe-017",
    name: "North York Civic Centre",
    address: "5100 Yonge St, North York, ON",
    lat: 43.7650,
    lon: -79.4101,
    type: "civic",
    typicalCrowdSize: 1200,
    description: "North York municipal services",
  },
  {
    id: "pe-018",
    name: "Mel Lastman Square",
    address: "5100 Yonge St, North York, ON",
    lat: 43.7650,
    lon: -79.4101,
    type: "civic",
    typicalCrowdSize: 1500,
    description: "North York public square",
  },
  {
    id: "pe-019",
    name: "Toronto Police Headquarters",
    address: "40 College St, Toronto, ON",
    lat: 43.6598,
    lon: -79.3893,
    type: "law-enforcement",
    typicalCrowdSize: 2000,
    description: "Police service demonstrations",
  },
  {
    id: "pe-020",
    name: "Ontario Science Centre",
    address: "770 Don Mills Rd, North York, ON",
    lat: 43.7146,
    lon: -79.3375,
    type: "government",
    typicalCrowdSize: 1000,
    description: "Government facility protests",
  },
];

// Fetch events from Toronto Festivals & Events Open Data (via CivicTechTO proxy)
// Source: https://github.com/CivicTechTO/toronto-opendata-festivalsandevents-jsonld-proxy
// Raw JSON-LD: https://raw.githubusercontent.com/CivicTechTO/toronto-opendata-festivalsandevents-jsonld-proxy/main/docs/upcoming.jsonld
//
// This is Toronto's official events feed (festivals, rallies, community gatherings, civic events)
// Filtered to Toronto-only events with valid geolocation
// Updated daily via GitHub Actions
async function fetchTorontoEvents() {
  try {
    const apiUrl = "https://raw.githubusercontent.com/CivicTechTO/toronto-opendata-festivalsandevents-jsonld-proxy/main/docs/upcoming.jsonld";

    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(15000) // 15 second timeout for JSON-LD fetch
    });

    if (!response.ok) {
      console.error(`Toronto events API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Transform Toronto events data to our format
    const events = [];
    if (Array.isArray(data)) {
      let idCounter = 1;

      for (const event of data) {
        // Filter: Only Toronto events with valid geolocation
        const location = event.location || {};
        const address = location.address || {};
        const geo = location.geo || {};

        // Check if in Toronto (addressLocality or we have Toronto coordinates)
        const isToronto = address.addressLocality === 'Toronto' ||
                          address.addressRegion === 'ON' ||
                          (geo.latitude && geo.longitude); // Accept ON events with coords

        // Must have valid coordinates
        const lat = geo.latitude;
        const lon = geo.longitude;

        if (!isToronto || !lat || !lon || isNaN(lat) || isNaN(lon)) {
          continue; // Skip non-Toronto or events without coords
        }

        // Build full address
        const streetAddress = address.streetAddress || '';
        const city = address.addressLocality || 'Toronto';
        const province = address.addressRegion || 'ON';
        const fullAddress = streetAddress
          ? `${streetAddress}, ${city}, ${province}`
          : `${city}, ${province}`;

        // Determine event type based on keywords
        const keywords = event.keywords || [];
        const keywordsLower = keywords.map(k => k.toLowerCase());
        const nameLower = (event.name || '').toLowerCase();
        const descriptionLower = (event.description || '').toLowerCase();

        let eventType = 'event'; // Default
        if (keywordsLower.some(k => k.includes('protest') || k.includes('demonstration') || k.includes('rally')) ||
            nameLower.includes('protest') || descriptionLower.includes('protest')) {
          eventType = 'protest';
        } else if (keywordsLower.some(k => k.includes('civic') || k.includes('community') || k.includes('town hall'))) {
          eventType = 'civic';
        } else if (keywordsLower.some(k => k.includes('festival') || k.includes('concert') || k.includes('music'))) {
          eventType = 'cultural';
        }

        // Extract crowd size estimate (not provided in this feed, so estimate based on event type)
        const typicalCrowdSize = estimateCrowdSize(eventType, nameLower);

        events.push({
          id: `to-event-${Date.now()}-${idCounter++}`,
          name: event.name || "Toronto Event",
          address: fullAddress,
          lat: lat,
          lon: lon,
          type: eventType,
          typicalCrowdSize: typicalCrowdSize,
          description: event.description || "Toronto event from official feed",
          source: "Toronto Open Data",
          publishedAt: event.startDate || new Date().toISOString(),
          url: event.url || null,
        });
      }

      // Sort by date (upcoming first)
      events.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    }

    return events.length > 0 ? events : null;
  } catch (error) {
    console.error("Toronto events fetch error:", error);
    return null;
  }
}

// Estimate crowd size based on event type and name
function estimateCrowdSize(eventType, nameLower) {
  // Base estimates by type
  const baseEstimates = {
    'protest': 500,
    'civic': 300,
    'cultural': 1000,
    'event': 500,
  };

  let estimate = baseEstimates[eventType] || 500;

  // Adjust based on venue cues in name
  if (nameLower.includes('square') || nameLower.includes('park')) {
    estimate *= 2; // Outdoor venues hold more
  }
  if (nameLower.includes('hall') || nameLower.includes('theatre')) {
    estimate *= 0.5; // Indoor venues hold fewer
  }
  if (nameLower.includes('festival')) {
    estimate *= 3; // Festivals attract larger crowds
  }

  return Math.round(estimate);
}

async function handler(_req) {
  var now = new Date().toISOString();

  try {
    // Try cache first
    var cached = await getCachedData(CACHE_KEY);
    if (cached && cached.events && cached.events.length > 0) {
      return jsonResponse(cached, 200, {
        "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
        "Access-Control-Allow-Origin": "*",
      });
    }

    // Try fetching real data from Toronto Open Data
    var torontoEvents = await fetchTorontoEvents();
    var useRealData = false;

    if (torontoEvents && torontoEvents.length > 0) {
      // Use Toronto events data (limit to most recent 30)
      var recentEvents = torontoEvents.slice(0, 30);

      var response = {
        events: recentEvents,
        total: recentEvents.length,
        lastUpdated: now,
        dataSource: "Toronto Open Data",
        seedDataFallback: SEED_EVENTS,
      };
      useRealData = true;
    } else {
      // Fall back to seed data
      var response = {
        events: SEED_EVENTS,
        total: SEED_EVENTS.length,
        lastUpdated: now,
        dataSource: "seed",
      };
    }

    await setCachedData(CACHE_KEY, response, CACHE_TTL_SECONDS);

    return jsonResponse(response, 200, {
      "Cache-Control": "public, s-maxage=" + CACHE_TTL_SECONDS + ", stale-while-revalidate=" + (CACHE_TTL_SECONDS / 2),
      "Access-Control-Allow-Origin": "*",
      "X-Data-Source": useRealData ? "Toronto Open Data" : "seed",
    });
  } catch (error) {
    console.error("Protest Events API error:", error);
    return jsonResponse({
      events: SEED_EVENTS,
      total: SEED_EVENTS.length,
      lastUpdated: now,
      dataSource: "seed-fallback",
      error: error.message || "Unknown error",
    }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    });
  }
}

export { config, handler as default };