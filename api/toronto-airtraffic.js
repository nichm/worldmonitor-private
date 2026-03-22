// api/toronto-airtraffic.js
function getPublicCorsHeaders(methods = "GET, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-WorldMonitor-Key",
    "Access-Control-Max-Age": "86400"
  };
}
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
var OPENSKY_TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
var OPENSKY_STATES_URL = "https://opensky-network.org/api/states/all";
var GTA_BBOX = {
  lamin: 43.4,
  lamax: 44,
  lomin: -79.8,
  lomax: -78.9
};
var EMERGENCY_SQUAWKS = ["7500", "7600", "7700"];
var cachedToken = null;
var tokenExpiry = 0;
var TOKEN_CACHE_MS = 29 * 60 * 1e3;
var CACHE_TTL = 90;
async function fetchOpenSkyToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("OPENSKY_CREDENTIALS_MISSING");
  }
  try {
    const response = await fetch(OPENSKY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      }),
      signal: AbortSignal.timeout(1e4)
    });
    if (!response.ok) {
      throw new Error(`OpenSky token request failed: ${response.status}`);
    }
    const data = await response.json();
    if (!data.access_token) {
      throw new Error("Invalid OpenSky token response");
    }
    cachedToken = data.access_token;
    tokenExpiry = now + TOKEN_CACHE_MS;
    return cachedToken;
  } catch (error) {
    console.error("[OpenSky] Token fetch failed:", error);
    throw error;
  }
}
async function fetchAircraftStates() {
  try {
    const token = await fetchOpenSkyToken();
    const url = `${OPENSKY_STATES_URL}?lamin=${GTA_BBOX.lamin}&lamax=${GTA_BBOX.lamax}&lomin=${GTA_BBOX.lomin}&lomax=${GTA_BBOX.lomax}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) {
      throw new Error(`OpenSky states request failed: ${response.status}`);
    }
    const data = await response.json();
    if (!data.states || !Array.isArray(data.states)) {
      throw new Error("Invalid OpenSky states response");
    }
    const aircraft = data.states.map((state) => ({
      icao24: state[0],
      callsign: state[1]?.trim() || null,
      originCountry: state[2],
      timePosition: state[3],
      timeVelocity: state[4],
      longitude: state[5],
      latitude: state[6],
      altitude: state[7],
      onGround: state[8],
      velocity: state[9],
      heading: state[10],
      verticalRate: state[11],
      squawk: state[12] ? String(state[12]).padStart(4, "0") : null
    }));
    const validAircraft = aircraft.filter(
      (ac) => ac.latitude !== null && ac.longitude !== null && ac.latitude !== void 0 && ac.longitude !== void 0
    );
    const emergencies = validAircraft.filter(
      (ac) => ac.squawk && EMERGENCY_SQUAWKS.includes(ac.squawk)
    );
    return {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      aircraft: validAircraft,
      total: validAircraft.length,
      airborneCount: validAircraft.filter((ac) => !ac.onGround).length,
      groundCount: validAircraft.filter((ac) => ac.onGround).length,
      emergencyCount: emergencies.length,
      emergencies: emergencies.map((ac) => ({
        icao24: ac.icao24,
        callsign: ac.callsign,
        squawk: ac.squawk,
        latitude: ac.latitude,
        longitude: ac.longitude,
        altitude: ac.altitude,
        onGround: ac.onGround
      })),
      gtaBounds: GTA_BBOX
    };
  } catch (error) {
    console.error("[OpenSky] States fetch failed:", error);
    throw error;
  }
}
async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getPublicCorsHeaders() });
  }
  try {
    const clientId = process.env.OPENSKY_CLIENT_ID;
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return jsonResponse(
        {
          error: "OPENSKY_CREDENTIALS_MISSING",
          message: "OpenSky credentials not configured. Set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET environment variables.",
          aircraft: [],
          total: 0,
          emergencyCount: 0
        },
        503,
        {
          "Cache-Control": "no-cache, no-store",
          ...getPublicCorsHeaders()
        }
      );
    }
    const data = await fetchAircraftStates();
    return jsonResponse(
      data,
      200,
      {
        "Cache-Control": `s-maxage=${CACHE_TTL}, stale-while-revalidate=${Math.floor(CACHE_TTL / 2)}`,
        ...getPublicCorsHeaders()
      }
    );
  } catch (error) {
    console.error("[OpenSky] Error:", error);
    if (error.message === "OPENSKY_CREDENTIALS_MISSING") {
      return jsonResponse(
        {
          error: "OPENSKY_CREDENTIALS_MISSING",
          message: "OpenSky credentials not configured",
          aircraft: [],
          total: 0,
          emergencyCount: 0
        },
        503,
        {
          "Cache-Control": "no-cache, no-store",
          ...getPublicCorsHeaders()
        }
      );
    }
    return jsonResponse(
      {
        error: "Air traffic data temporarily unavailable",
        message: error.message,
        aircraft: [],
        total: 0,
        emergencyCount: 0
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
