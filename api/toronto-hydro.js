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
 * - PowerOutage.com offers a commercial API but requires paid subscription
 * - No scrapers or reverse-engineered APIs found on GitHub
 * - The outage map page loads data dynamically via JavaScript, making web
 *   scraping brittle and maintenance-heavy
 *
 * Alternative options considered:
 * - Web scraping with Puppeteer (like Toronto Fire): Too brittle, high
 *   maintenance, likely to break frequently
 * - IESO data: Only generator outages, not customer outages
 * - PowerOutage.com commercial API: Paid subscription required
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

const config = { runtime: "edge" };

// Seed data: representative Toronto Hydro outage locations (placeholder only)
// NOTE: This is NOT real data - it's for API compatibility only
const SEED_DATA = [
  { id: "th-1", area: "Downtown Core", affected: 142, cause: "Equipment failure", status: "Active", latitude: 43.6532, longitude: -79.3832, reportedAt: "2026-03-24T08:00:00Z", estimatedRestoration: "2026-03-24T14:00:00Z" },
  { id: "th-2", area: "North York", affected: 89, cause: "Planned maintenance", status: "Active", latitude: 43.7615, longitude: -79.4111, reportedAt: "2026-03-24T06:30:00Z", estimatedRestoration: "2026-03-24T16:00:00Z" },
  { id: "th-3", area: "Scarborough", affected: 56, cause: "Weather related", status: "Active", latitude: 43.7731, longitude: -79.2573, reportedAt: "2026-03-24T09:15:00Z", estimatedRestoration: "2026-03-24T18:00:00Z" },
  { id: "th-4", area: "Etobicoke", affected: 203, cause: "Vehicle collision", status: "Active", latitude: 43.6591, longitude: -79.5327, reportedAt: "2026-03-24T10:00:00Z", estimatedRestoration: "2026-03-24T15:00:00Z" },
  { id: "th-5", area: "Midtown", affected: 31, cause: "Underground fault", status: "Active", latitude: 43.7068, longitude: -79.3985, reportedAt: "2026-03-24T07:45:00Z", estimatedRestoration: "2026-03-24T12:00:00Z" },
];

async function handler(_req) {
  const now = new Date().toISOString();
  return jsonResponse({
    outages: SEED_DATA,
    total: SEED_DATA.length,
    lastUpdated: now,
    source: "seed",
    note: "Toronto Hydro does not provide a public API for outage data. This is placeholder data for API compatibility.",
    realSource: "None available - outage map at https://outagemap.torontohydro.com/ has no accessible API",
    metadata: {
      dataSource: "Seed data (placeholder)",
      lastChecked: now
    }
  }, 200, {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    "Access-Control-Allow-Origin": "*",
  });
}

export { config, handler as default };