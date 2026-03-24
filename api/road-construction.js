/**
 * Road Construction & Closures API
 * Edge function - fetches from City of Toronto Open Data
 */

import { jsonResponse } from './_json-response.js';
import { getCachedData, setCachedData } from './_upstash-json.js';

const DATA_URL = 'https://secure.toronto.ca/opendata/cart/road_restrictions/v3?format=json';
var config = { runtime: "edge" };

async function handler(_req) {
  try {
    const res = await fetch(DATA_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error('[Road Construction API] HTTP error:', res.status);
      return jsonResponse({ events: [], error: `HTTP ${res.status}` }, 200);
    }

    const rawData = await res.json();

    // Parse and normalize the data
    const events = [];

    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        events.push({
          id: item.event_id || item.id || Date.now().toString() + Math.random(),
          eventTitle: item.event_title || item.Event_Title || item.title || 'Unknown',
          eventType: item.event_type || item.Event_Type || item.type || 'Construction',
          classification: item.classification || item.Classification || 'Other',
          roadName: item.road_name || item.Road_Name || null,
          from: item.from || item.From || null,
          to: item.to || item.To || null,
          direction: item.direction || item.Direction || null,
          startDate: item.start_date || item.Start_Date || null,
          endDate: item.end_date || item.End_Date || null,
          status: item.status || item.Status || 'Unknown',
          latitude: item.latitude !== undefined ? Number(item.latitude) : (item.Latitude !== undefined ? Number(item.Latitude) : null),
          longitude: item.longitude !== undefined ? Number(item.longitude) : (item.Longitude !== undefined ? Number(item.Longitude) : null),
          description: item.description || item.Description || '',
        });
      }
    }

    return jsonResponse(events, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=150",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (error) {
    console.error('[Road Construction API] Error:', error);
    return jsonResponse({ events: [], error: String(error) }, 200, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      "Access-Control-Allow-Origin": "*",
    });
  }
}

export { config, handler as default };