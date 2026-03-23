// api/toronto-dinesafe.js
// DEPRECATED: No real-time DineSafe data source available

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

async function handler(_req) {
  console.log("DineSafe API: DEPRECATED - No real-time data source available");

  const deprecationResponse = {
    status: "deprecated",
    message: "DineSafe API has been removed - no real-time data source available",
    details: {
      reason: "All data sources are unavailable or contain stale data",
      research_findings: {
        official_ckan: "Retired - marked as 'Change Requested'",
        heroku_api: "Dead - returns 'No such app' error",
        github_mirror: "Last release v2025.11.09 (4 months old)",
        official_website: "No accessible API endpoints found",
        community_apis: "All dead or extremely outdated (13+ years old)"
      },
      recommendation: "Contact Toronto Public Health directly for current inspection results",
      official_website: "https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/food-safety/dinesafe/",
      last_checked: new Date().toISOString()
    },
    historical_data: {
      note: "Historical data from 2025 available for reference only",
      source: "benwebber/open-data-toronto-dinesafe",
      latest_release: "v2025.11.09 (November 2025)",
      total_closures: 33,
      data_age_months: 4
    }
  };

  return jsonResponse(
    deprecationResponse,
    410, // 410 Gone - resource is no longer available
    {
      "X-Deprecated": "true",
      "X-Reason": "No real-time data source available",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*"
    }
  );
}

export {
  config,
  handler as default
};
