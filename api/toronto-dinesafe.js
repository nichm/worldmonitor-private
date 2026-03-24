// api/toronto-dinesafe.js
// Edge function: DineSafe Toronto Food Premises Inspections
// Source: City of Toronto Open Data (live CSV/JSON updated daily)
// Dataset: https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/b6b4f3fb-2e2c-47e7-931d-b87d22806948
// Last refreshed: 2026-02-20 | 149,938 inspection records

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

const config = { runtime: "edge" };

// Direct download URL for live DineSafe data (updated daily by City of Toronto)
const DINSAFE_JSON_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/b6b4f3fb-2e2c-47e7-931d-b87d22806948/resource/e9df9d33-727e-4758-9a84-67ebefec1453/download/dinesafe.json";

// In-memory cache with TTL
let cachedData = null;
let cachedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (data updates daily)

// Helper to get latest inspection per establishment
function getLatestInspections(inspections) {
  const latestByEstablishment = new Map();

  for (const inspection of inspections) {
    const id = inspection["Establishment ID"];
    const date = inspection["Inspection Date"];

    if (!id || !date) continue;

    const existing = latestByEstablishment.get(id);
    if (!existing || date > existing["Inspection Date"]) {
      latestByEstablishment.set(id, inspection);
    }
  }

  return Array.from(latestByEstablishment.values());
}

// Helper to normalize inspection status
function normalizeStatus(status) {
  if (!status) return "Unknown";
  const s = status.toLowerCase().trim();
  if (s === "pass" || s.includes("pass")) return "Pass";
  if (s === "conditional pass" || s.includes("conditional")) return "Conditional Pass";
  if (s === "closed" || s.includes("close")) return "Closed";
  return status;
}

// Helper to get severity level
function getSeverity(severity) {
  if (!severity) return null;
  const s = severity.toUpperCase().trim();
  if (s.startsWith("C")) return "Crucial";
  if (s.startsWith("S")) return "Significant";
  if (s.startsWith("M")) return "Minor";
  if (s.startsWith("N")) return "None";
  return null;
}

async function fetchDineSafeData() {
  const now = Date.now();

  // Return cached data if still fresh
  if (cachedData && now - cachedAt < CACHE_TTL) {
    console.log("[DineSafe] Using cached data");
    return cachedData;
  }

  try {
    console.log("[DineSafe] Fetching latest data from City of Toronto");

    const response = await fetch(DINSAFE_JSON_URL, {
      signal: AbortSignal.timeout(30000),
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch DineSafe data: ${response.status}`);
    }

    const rawData = await response.json();

    if (!Array.isArray(rawData)) {
      throw new Error("DineSafe data is not an array");
    }

    console.log(`[DineSafe] Loaded ${rawData.length} inspection records`);

    // Get only the latest inspection per establishment
    const latestInspections = getLatestInspections(rawData);

    console.log(`[DineSafe] Latest inspections: ${latestInspections.length} unique establishments`);

    // Transform to our format
    const inspections = latestInspections
      .filter(insp => insp["Latitude"] && insp["Longitude"]) // Only geocoded records
      .map(insp => ({
        id: insp["Establishment ID"]?.toString() || insp["unique_id"] || "",
        name: insp["Establishment Name"] || "",
        type: insp["Establishment Type"] || "",
        address: insp["Establishment Address"] || "",
        status: normalizeStatus(insp["Establishment Status"]),
        inspectionDate: insp["Inspection Date"] || "",
        infractionDetails: insp["Infraction Details"] || null,
        severity: getSeverity(insp["Severity"]),
        action: insp["Action"] || null,
        amountFined: insp["Amount Fined"] || null,
        latitude: parseFloat(insp["Latitude"]) || null,
        longitude: parseFloat(insp["Longitude"]) || null,
        minInspectionsPerYear: insp["Min. Inspections Per Year"] || "2"
      }))
      .filter(insp => insp.latitude && insp.longitude && insp.name); // Filter out invalid records

    // Calculate summary stats
    const statusCounts = inspections.reduce((acc, insp) => {
      acc[insp.status] = (acc[insp.status] || 0) + 1;
      return acc;
    }, {});

    const criticalCount = inspections.filter(insp =>
      insp.status === "Closed" || insp.severity === "Crucial"
    ).length;

    const result = {
      inspections: inspections,
      total: inspections.length,
      summary: {
        byStatus: statusCounts,
        criticalIssues: criticalCount,
        lastUpdated: new Date().toISOString()
      },
      dataSource: "City of Toronto Open Data (DineSafe)",
      dataUrl: "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/b6b4f3fb-2e2c-47e7-931d-b87d22806948",
      fetchedAt: new Date().toISOString()
    };

    // Update cache
    cachedData = result;
    cachedAt = now;

    console.log(`[DineSafe] ✓ Cached ${inspections.length} inspections`);
    console.log(`[DineSafe] Status breakdown: Pass=${statusCounts.Pass || 0}, Conditional=${statusCounts["Conditional Pass"] || 0}, Closed=${statusCounts.Closed || 0}`);

    return result;

  } catch (error) {
    console.error("[DineSafe] Fetch failed:", error);

    // Return cached data if available, even if expired
    if (cachedData) {
      console.log("[DineSafe] Returning stale cached data");
      return {
        ...cachedData,
        stale: true,
        notice: "Using cached data - fresh fetch failed"
      };
    }

    // Return error response
    return {
      error: "Unable to fetch DineSafe data",
      message: error.message,
      fetchedAt: new Date().toISOString(),
      dataSource: "City of Toronto Open Data (DineSafe)"
    };
  }
}

async function handler(_req) {
  const data = await fetchDineSafeData();

  if (!data || data.error) {
    return jsonResponse(
      {
        error: data?.error || "DineSafe data temporarily unavailable",
        message: data?.message || "",
        fetchedAt: new Date().toISOString(),
        dataSource: "City of Toronto Open Data (DineSafe)"
      },
      503,
      {
        "Cache-Control": "no-cache, no-store",
        "Access-Control-Allow-Origin": "*"
      }
    );
  }

  return jsonResponse(
    data,
    200,
    {
      "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=3600",
      "Access-Control-Allow-Origin": "*"
    }
  );
}

export {
  config,
  handler as default
};