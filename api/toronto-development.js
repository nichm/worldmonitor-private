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
var CKAN_BASE_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca";
var DATASET_ID = "8907d8ed-c515-4ce9-b674-9f8c6eefcf0d";
var config = { runtime: "edge" };
var TODAY = /* @__PURE__ */ new Date();
var SEED_DEVELOPMENT_DATA = {
  applications: [
    {
      application_number: "20 123456 STE 12",
      application_date: "2025-02-15",
      application_type: "Site Plan Control",
      application_status: "Under Review",
      status_current: "Under Review",
      description: "Mixed-use development with residential and commercial space",
      property_address: "1234 Yonge Street",
      postal_code: "M4W 1A1",
      lat: 43.7128,
      lon: -79.3907,
      ward_name: "Toronto Centre",
      city: "Toronto",
      category: "site_plan"
    },
    {
      application_number: "24 789012 EZ 04",
      application_date: "2025-01-22",
      application_type: "Zoning By-law Amendment",
      application_status: "Under Review",
      status_current: "Under Review",
      description: "Rezoning for residential tower development",
      property_address: "456 Bay Street",
      postal_code: "M5G 2C8",
      lat: 43.6489,
      lon: -79.3816,
      ward_name: "Spadina-Fort York",
      city: "Toronto",
      category: "rezoning"
    },
    {
      application_number: "23 456789 OPA 09",
      application_date: "2025-03-01",
      application_type: "Official Plan Amendment",
      application_status: "Under Review",
      status_current: "Under Review",
      description: "Official Plan amendment for mixed-use development",
      property_address: "789 King Street West",
      postal_code: "M5V 1A1",
      lat: 43.6456,
      lon: -79.4012,
      ward_name: "Spadina-Fort York",
      city: "Toronto",
      category: "opa"
    },
    {
      application_number: "24 234567 STE 08",
      application_date: "2025-02-28",
      application_type: "Site Plan Control",
      application_status: "Under Review",
      status_current: "Under Review",
      description: "Commercial and residential development",
      property_address: "321 Queen Street West",
      postal_code: "M5V 2A4",
      lat: 43.6498,
      lon: -79.3987,
      ward_name: "Spadina-Fort York",
      city: "Toronto",
      category: "site_plan"
    },
    {
      application_number: "24 567890 EZ 11",
      application_date: "2025-03-05",
      application_type: "Zoning By-law Amendment",
      application_status: "Under Review",
      status_current: "Under Review",
      description: "Zoning amendment for increased height and density",
      property_address: "555 Bloor Street West",
      postal_code: "M5S 1Y6",
      lat: 43.6629,
      lon: -79.4012,
      ward_name: "University-Rosedale",
      city: "Toronto",
      category: "rezoning"
    }
  ],
  categoryCounts: { site_plan: 2, rezoning: 2, opa: 1, other: 0 },
  total: 5,
  using_seed_data: true,
  fetched_at: TODAY.toISOString()
};
async function handler(_req) {
  try {
    const url = `${CKAN_BASE_URL}/api/3/action/datastore_search`;
    const body = {
      resource_id: DATASET_ID,
      limit: 500,
      sort: "DATE_SUBMITTED desc"
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "worldmonitor.app",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2e4)
    });
    if (!response.ok) {
      throw new Error(`CKAN API returned ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error("Invalid JSON response from CKAN");
    }
    if (!json.success || !json.result || !json.result.records) {
      throw new Error("Invalid CKAN response structure");
    }
    const oneYearAgo = new Date(TODAY.getTime() - 365 * 24 * 60 * 60 * 1e3);
    const applications = json.result.records.filter((record) => {
      const date = record.DATE_SUBMITTED || record.DATE_SUBMITTED || "";
      const submittedDate = new Date(date);
      const isValidDate = !isNaN(submittedDate.getTime()) && submittedDate >= oneYearAgo;
      const hasValidCoords = record.X && record.Y;
      const status = record.STATUS || "";
      const isNotClosed = !["Refused", "Withdrawn", "Closed", "Discontinued"].some((s) => status.toUpperCase().includes(s.toUpperCase()));
      return isValidDate && hasValidCoords && isNotClosed;
    }).map((record) => {
      const status = record.STATUS || "Unknown";
      let category = "other";
      if (status.toUpperCase().includes("SITE PLAN") || status.toUpperCase().includes("BUILDING PERMIT")) {
        category = "site_plan";
      } else if (status.toUpperCase().includes("ZONING") || status.toUpperCase().includes("AMENDMENT")) {
        category = "rezoning";
      } else if (status.toUpperCase().includes("OPA") || status.toUpperCase().includes("OFFICIAL PLAN") || status.toUpperCase().includes("PLANNING")) {
        category = "opa";
      }
      return {
        application_number: record.APPLICATION_NUMBER || record.APPLICATION__ || "",
        application_date: record.DATE_SUBMITTED || "",
        application_type: record.APPLICATION_TYPE || "Unknown",
        application_status: status,
        status_current: status,
        description: record.DESCRIPTION || null,
        property_address: [record.STREET_NUM, record.STREET_NAME, record.STREET_TYPE, record.STREET_DIRECTION].filter(Boolean).join(" ") || "Unknown",
        postal_code: record.POSTAL || "",
        lat: parseFloat(record.Y),
        lon: parseFloat(record.X),
        ward_name: record.WARD_NAME || "",
        city: "Toronto",
        category
      };
    }).slice(0, 500);
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
        total: applications.length,
        fetched_at: TODAY.toISOString()
      },
      200,
      {
        "Cache-Control": "public, max-age=21600, s-maxage=21600, stale-if-error=3600",
        "Access-Control-Allow-Origin": "*"
      }
    );
  } catch (error) {
    console.error("Toronto Development API error:", error);
    return jsonResponse(
      {
        ...SEED_DEVELOPMENT_DATA,
        error: "Failed to fetch development data",
        message: error.message
      },
      200,
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
