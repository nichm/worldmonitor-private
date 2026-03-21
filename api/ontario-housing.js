// api/ontario-housing.js
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
const ONTARIO_OPEN_DATA_URL = "https://data.ontario.ca/api/3/action/package_show?id=ontario-s-housing-supply-progress";
const RESOURCE_NAME = "ontario_housing_supply_progress.csv";
const config = { runtime: "edge" };
const GTA_MUNICIPALITIES = [
  "Toronto",
  "Mississauga",
  "Brampton",
  "Markham",
  "Vaughan",
  "Oakville",
  "Burlington"
];
async function handler(_req) {
  try {
    const packageResponse = await fetch(ONTARIO_OPEN_DATA_URL, {
      headers: {
        "User-Agent": "worldmonitor.app"
      }
    });
    if (!packageResponse.ok) {
      throw new Error(`Ontario Open Data API returned ${packageResponse.status}: ${packageResponse.statusText}`);
    }
    const packageJson = await packageResponse.json();
    if (!packageJson.success || !packageJson.result || !packageJson.result.resources) {
      throw new Error("Invalid Ontario Open Data response structure");
    }
    const csvResource = packageJson.result.resources.find(
      (r) => r.name === RESOURCE_NAME || r.url.endsWith(".csv")
    );
    if (!csvResource) {
      throw new Error("CSV resource not found in Ontario Housing package");
    }
    const csvResponse = await fetch(csvResource.url);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status}`);
    }
    const csvText = await csvResponse.text();
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || "";
      }
      if (GTA_MUNICIPALITIES.includes(row.Municipality)) {
        const target = parseFloat(row.Target) || 0;
        const housingUnits = parseFloat(row["Housing Units"] || row.Housing_Units || "0") || 0;
        data.push({
          _id: i - 1,
          Municipality: row.Municipality,
          Year: parseInt(row.Year, 10) || (/* @__PURE__ */ new Date()).getFullYear(),
          Target: target,
          Housing_Units: housingUnits,
          Progress_Percentage: target > 0 ? housingUnits / target * 100 : 0
        });
      }
    }
    data.sort((a, b) => b.Progress_Percentage - a.Progress_Percentage);
    return jsonResponse(data, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-if-error=7200",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("Ontario Housing API error:", error);
    return jsonResponse({ error: "Failed to fetch Ontario Housing data", message: error.message }, 500, {
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-if-error=1200",
      "Access-Control-Allow-Origin": "*"
    });
  }
}
export {
  config,
  handler as default
};
