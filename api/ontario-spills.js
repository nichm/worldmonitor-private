// api/_cors.js
function getPublicCorsHeaders(methods = "GET, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-WorldMonitor-Key",
    "Access-Control-Max-Age": "86400"
  };
}

// api/_json-response.js
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

// api/ontario-spills.js
var config = { runtime: "edge" };
var CKAN_BASE = "https://data.ontario.ca/api/3/action";
var PACKAGE_ID = "spills-to-the-natural-environment";
var CACHE_TTL = 21600;
var GTA_MUNICIPALITIES = [
  "Toronto",
  "Mississauga",
  "Brampton",
  "Markham",
  "Vaughan",
  "Richmond Hill",
  "Oakville",
  "Burlington",
  "Ajax",
  "Pickering"
];
var FLASH_CLASSES = [
  "Class 1 - Flammable Gases",
  "Class 1 - Flammable Liquids",
  "Class 6 - Toxic",
  "Class 6 - Toxic and Infectious Substances"
];
var PRIORITY_CLASSES = [
  "Class 2 - Compressed Gases",
  "Class 8 - Corrosive"
];
function classifySpill(spill) {
  const material = spill.Material_Spent?.toLowerCase() || "";
  const hazardClass = spill.Hazard_Class || "";
  for (const flashClass of FLASH_CLASSES) {
    if (hazardClass.includes(flashClass) || material.toLowerCase().includes("flammable") || material.toLowerCase().includes("toxic")) {
      return "FLASH";
    }
  }
  for (const priorityClass of PRIORITY_CLASSES) {
    if (hazardClass.includes(priorityClass)) {
      return "PRIORITY";
    }
  }
  if (hazardClass && hazardClass !== "Unknown") {
    return "ROUTINE";
  }
  return "NONE";
}
async function fetchSpillsData() {
  const endDate = /* @__PURE__ */ new Date();
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];
  const sqlQuery = `
    SELECT *
    FROM "${PACKAGE_ID}"
    WHERE "Spill_Date" >= '${startDateStr}'
      AND "Spill_Date" <= '${endDateStr}'
    ORDER BY "Spill_Date" DESC
    LIMIT 500
  `;
  try {
    const response = await fetch(`${CKAN_BASE}/datastore_search_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sql: sqlQuery
      }),
      signal: AbortSignal.timeout(3e4)
    });
    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status}`);
    }
    const data = await response.json();
    if (!data.success || !data.result) {
      throw new Error("Invalid CKAN response");
    }
    const records = data.result.records;
    const gtaSpills = records.filter((record) => {
      const city = record.City_Spilled?.toLowerCase() || "";
      return GTA_MUNICIPALITIES.some((muni) => city.includes(muni.toLowerCase()));
    });
    const classified = gtaSpills.map((record) => ({
      id: record._id || `${record.Spill_Date}-${record.City_Spilled}-${record.Material_Spent}`,
      spillDate: record.Spill_Date,
      reportedDate: record.Date_Reported,
      city: record.City_Spilled,
      address: record.Address_Spilled,
      material: record.Material_Spent,
      quantity: record.Quantity_Spent,
      units: record.Units_Spent,
      hazardClass: record.Hazard_Class,
      category: record.Category,
      severityLevel: classifySpill(record)
    }));
    return {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      spills: classified,
      total: classified.length,
      flashCount: classified.filter((s) => s.severityLevel === "FLASH").length,
      priorityCount: classified.filter((s) => s.severityLevel === "PRIORITY").length,
      routineCount: classified.filter((s) => s.severityLevel === "ROUTINE").length,
      dateRange: { startDate: startDateStr, endDate: endDateStr }
    };
  } catch (error) {
    console.error("[Spills] Fetch failed:", error);
    throw error;
  }
}
async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getPublicCorsHeaders() });
  }
  try {
    const data = await fetchSpillsData();
    return jsonResponse(
      data,
      200,
      {
        "Cache-Control": `s-maxage=${CACHE_TTL}, stale-while-revalidate=${Math.floor(CACHE_TTL / 2)}`,
        ...getPublicCorsHeaders()
      }
    );
  } catch (error) {
    console.error("[Spills] Error:", error);
    return jsonResponse(
      {
        error: "Spills data temporarily unavailable",
        message: error.message,
        spills: [],
        total: 0,
        flashCount: 0,
        priorityCount: 0,
        routineCount: 0
      },
      503,
      {
        "Cache-Control": "no-cache, no-store",
        ...getPublicCorsHeaders()
      }
    );
  }
}
export {
  config,
  handler as default
};
