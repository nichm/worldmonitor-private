// api/toronto-development.js
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
const CKAN_BASE_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca";
const DATASET_ID = "development_applications";
const config = { runtime: "edge" };
const TODAY = /* @__PURE__ */ new Date();
const ONE_YEAR_AGO = new Date(TODAY.getTime() - 365 * 24 * 60 * 60 * 1e3);
function formatDate(date) {
  return date.toISOString().split("T")[0];
}
async function handler(_req) {
  try {
    const sql = `
      SELECT
        APPLICATION_NUMBER,
        APPLICATION_DATE,
        APPLICATION_TYPE,
        APPLICATION_STATUS,
        STATUS_CURRENT,
        DESCRIPTION,
        PROPERTY_ADDRESS,
        POSTAL_CODE,
        LATITUDE,
        LONGITUDE,
        WARD_NAME,
        CITY
      FROM "${DATASET_ID}"
      WHERE APPLICATION_DATE >= '${formatDate(ONE_YEAR_AGO)}'
        AND APPLICATION_STATUS NOT IN ('Refused', 'Withdrawn', 'Closed', 'Discontinued')
      ORDER BY APPLICATION_DATE DESC
      LIMIT 500
    `.trim().replace(/\s+/g, " ");
    const url = `${CKAN_BASE_URL}/api/action/datastore_sql?q=${encodeURIComponent(sql)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "worldmonitor.app"
      }
    });
    if (!response.ok) {
      throw new Error(`CKAN API returned ${response.status}: ${response.statusText}`);
    }
    const json = await response.json();
    if (!json.success || !json.result || !json.result.records) {
      throw new Error("Invalid CKAN response structure");
    }
    const applications = json.result.records.filter((record) => record.LATITUDE && record.LONGITUDE).map((record) => {
      const status = record.STATUS_CURRENT || record.APPLICATION_STATUS || "Unknown";
      let category = "other";
      if (status.toLowerCase().includes("site plan") || status.toLowerCase().includes("building permit")) {
        category = "site_plan";
      } else if (status.toLowerCase().includes("rezoning") || status.toLowerCase().includes("amendment") || status.toLowerCase().includes("zoning")) {
        category = "rezoning";
      } else if (status.toLowerCase().includes("opa") || status.toLowerCase().includes("official plan") || status.toLowerCase().includes("planning")) {
        category = "opa";
      }
      return {
        application_number: record.APPLICATION_NUMBER || "",
        application_date: record.APPLICATION_DATE || "",
        application_type: record.APPLICATION_TYPE || "Unknown",
        application_status: record.APPLICATION_STATUS || "Unknown",
        status_current: record.STATUS_CURRENT || record.APPLICATION_STATUS || "Unknown",
        description: record.DESCRIPTION || null,
        property_address: record.PROPERTY_ADDRESS || "Unknown",
        postal_code: record.POSTAL_CODE || "",
        lat: parseFloat(record.LATITUDE),
        lon: parseFloat(record.LONGITUDE),
        ward_name: record.WARD_NAME || "",
        city: record.CITY || "Toronto",
        category
      };
    });
    const categoryCounts = {
      site_plan: applications.filter((app) => app.category === "site_plan").length,
      rezoning: applications.filter((app) => app.category === "rezoning").length,
      opa: applications.filter((app) => app.category === "opa").length,
      other: applications.filter((app) => app.category === "other").length
    };
    return jsonResponse(
      {
        applications,
        categoryCounts,
        total: applications.length
      },
      200,
      {
        "Cache-Control": "public, max-age=21600, s-maxage=21600, stale-if-error=3600",
        // 6 hours
        "Access-Control-Allow-Origin": "*"
      }
    );
  } catch (error) {
    console.error("Toronto Development API error:", error);
    return jsonResponse(
      {
        error: "Failed to fetch development data",
        message: error.message,
        applications: [],
        categoryCounts: { site_plan: 0, rezoning: 0, opa: 0, other: 0 },
        total: 0
      },
      200,
      // Return 200 with empty data to avoid breaking the app
      {
        "Cache-Control": "public, max-age=300, s-maxage=600, stale-if-error=1200",
        "Access-Control-Allow-Origin": "*"
      }
    );
  }
}
export {
  config,
  handler as default
};
