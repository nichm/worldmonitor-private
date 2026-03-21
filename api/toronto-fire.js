// api/toronto-fire.js
function sanitizeJsonValue(value, depth = 0) {
  if (depth > 20) return "[truncated]";
  if (value instanceof Error) {
    return { error: value.message };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const clone = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "stack" || key === "stackTrace" || key === "cause") continue;
      clone[key] = sanitizeJsonValue(nested, depth + 1);
    }
    return clone;
  }
  return value;
}
function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(sanitizeJsonValue(body)), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
var config = { runtime: "edge" };
var TORONTO_CAD_URL = "https://www.toronto.ca/fire/cadinfo/livecad.htm";
var CACHE_TTL = 5 * 60;
async function handler(req) {
  try {
    const response = await fetch(TORONTO_CAD_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WorldMonitor/1.0)"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const html = await response.text();
    const incidents = parseTorontoFireCAD(html);
    return jsonResponse(
      { incidents },
      200,
      {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=30`
      }
    );
  } catch (error) {
    console.error("[Toronto Fire] CAD fetch failed:", error);
    return jsonResponse(
      { error: error.message, incidents: [] },
      200,
      // Return 200 with empty incidents to avoid breaking the app
      {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=10"
      }
    );
  }
}
function parseTorontoFireCAD(html) {
  const incidents = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const tableMatches = html.matchAll(tableRegex);
  for (const tableMatch of tableMatches) {
    const tableHtml = tableMatch[1];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rowMatches = tableHtml.matchAll(rowRegex);
    let isFirstRow = true;
    for (const rowMatch of rowMatches) {
      const rowHtml = rowMatch[1];
      if (isFirstRow) {
        isFirstRow = false;
        continue;
      }
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      const cells = [];
      for (const cellMatch of rowHtml.matchAll(cellRegex)) {
        let cellContent = cellMatch[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
        cells.push(cellContent);
      }
      if (cells.length >= 3) {
        const [timeStr, address, alarmLevel, incidentType] = cells;
        const alarmMatch = alarmLevel.match(/(\d+)/);
        const alarm = alarmMatch ? parseInt(alarmMatch[1], 10) : 1;
        incidents.push({
          time: timeStr || null,
          address: address || "Unknown Location",
          alarm,
          incidentType: incidentType || "Unknown",
          timestamp: Date.now()
        });
      }
    }
  }
  return incidents;
}
export {
  config,
  handler as default
};
