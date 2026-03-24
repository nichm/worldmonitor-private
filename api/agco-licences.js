// api/agco-licences.js
// Edge function for AGCO Liquor Licences data
// Source: AGCO open data CSV download
// URL: https://agco.ca/sites/default/files/opendata/OpenDataGroceryAndConvenienceStoreLicences_En.csv
// The CSV contains all issued Convenience and Grocery Store liquor retail licences with addresses and status
// Filters for Toronto/GTA locations (postal codes starting with M)
// Caches for 24 hours, includes seed data fallback

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

const CACHE_KEY = "agco-licences";
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

const config = { runtime: "edge" };

// Seed data with pre-geocoded Toronto AGCO liquor licences
const SEED_AGCO_DATA = {
  licences: [
    {
      id: "agco1",
      businessName: "LCBO Agency #4521",
      licenceType: "lcbo_agency",
      address: "10 Queens Quay West",
      city: "Toronto",
      postalCode: "M5J 2H2",
      municipality: "Toronto",
      ward: "Spadina-Fort York",
      latitude: 43.6400,
      longitude: -79.3890,
      licenceNumber: "AGCO-4521",
      status: "Active",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-15"
    },
    {
      id: "agco2",
      businessName: "Metro - Beer Store",
      licenceType: "grocery",
      address: "2 Carlton Street",
      city: "Toronto",
      postalCode: "M5B 1J3",
      municipality: "Toronto",
      ward: "Toronto Centre",
      latitude: 43.6580,
      longitude: -79.3800,
      licenceNumber: "AGCO-7892",
      status: "Active",
      issueDate: "2024-02-01",
      expiryDate: "2025-02-01"
    },
    {
      id: "agco3",
      businessName: "Convenience Plus",
      licenceType: "convenience",
      address: "675 Yonge Street",
      city: "Toronto",
      postalCode: "M4Y 1Z9",
      municipality: "Toronto",
      ward: "Toronto Centre",
      latitude: 43.6650,
      longitude: -79.3840,
      licenceNumber: "AGCO-3456",
      status: "Active",
      issueDate: "2024-03-10",
      expiryDate: "2025-03-10"
    },
    {
      id: "agco4",
      businessName: "No Frills - Beer Wine",
      licenceType: "grocery",
      address: "225 Yonge Street",
      city: "Toronto",
      postalCode: "M5B 2H1",
      municipality: "Toronto",
      ward: "Toronto Centre",
      latitude: 43.6542,
      longitude: -79.3807,
      licenceNumber: "AGCO-9012",
      status: "Active",
      issueDate: "2024-01-20",
      expiryDate: "2025-01-20"
    },
    {
      id: "agco5",
      businessName: "LCBO Agency - Yorkville",
      licenceType: "lcbo_agency",
      address: "55 Bloor Street West",
      city: "Toronto",
      postalCode: "M4W 1A1",
      municipality: "Toronto",
      ward: "University-Rosedale",
      latitude: 43.6700,
      longitude: -79.3890,
      licenceNumber: "AGCO-5555",
      status: "Active",
      issueDate: "2024-02-15",
      expiryDate: "2025-02-15"
    },
    {
      id: "agco6",
      businessName: "7-Eleven #1234",
      licenceType: "convenience",
      address: "1100 Bay Street",
      city: "Toronto",
      postalCode: "M5S 2A2",
      municipality: "Toronto",
      ward: "University-Rosedale",
      latitude: 43.6720,
      longitude: -79.3860,
      licenceNumber: "AGCO-2222",
      status: "Active",
      issueDate: "2024-04-01",
      expiryDate: "2025-04-01"
    },
    {
      id: "agco7",
      businessName: "Loblaws - Liquor Department",
      licenceType: "grocery",
      address: "60 Carlton Street",
      city: "Toronto",
      postalCode: "M5B 1J2",
      municipality: "Toronto",
      ward: "Toronto Centre",
      latitude: 43.6590,
      longitude: -79.3780,
      licenceNumber: "AGCO-7777",
      status: "Active",
      issueDate: "2024-01-25",
      expiryDate: "2025-01-25"
    },
    {
      id: "agco8",
      businessName: "LCBO Agency - Eaton Centre",
      licenceType: "lcbo_agency",
      address: "220 Yonge Street",
      city: "Toronto",
      postalCode: "M5B 2H1",
      municipality: "Toronto",
      ward: "Toronto Centre",
      latitude: 43.6542,
      longitude: -79.3807,
      licenceNumber: "AGCO-8888",
      status: "Active",
      issueDate: "2024-03-01",
      expiryDate: "2025-03-01"
    },
    {
      id: "agco9",
      businessName: "Circle K - Wine Beer",
      licenceType: "convenience",
      address: "735 Yonge Street",
      city: "Toronto",
      postalCode: "M4Y 2C3",
      municipality: "Toronto",
      ward: "Toronto Centre",
      latitude: 43.6670,
      longitude: -79.3850,
      licenceNumber: "AGCO-3333",
      status: "Active",
      issueDate: "2024-02-20",
      expiryDate: "2025-02-20"
    },
    {
      id: "agco10",
      businessName: "Sobeys Urban Fresh",
      licenceType: "grocery",
      address: "155 Redpath Avenue",
      city: "Toronto",
      postalCode: "M4T 1K6",
      municipality: "Toronto",
      ward: "Toronto-St. Paul's",
      latitude: 43.7000,
      longitude: -79.3920,
      licenceNumber: "AGCO-6666",
      status: "Active",
      issueDate: "2024-01-30",
      expiryDate: "2025-01-30"
    },
    {
      id: "agco11",
      businessName: "LCBO Agency - Union Station",
      licenceType: "lcbo_agency",
      address: "65 Front Street West",
      city: "Toronto",
      postalCode: "M5J 1E6",
      municipality: "Toronto",
      ward: "Spadina-Fort York",
      latitude: 43.6450,
      longitude: -79.3800,
      licenceNumber: "AGCO-9999",
      status: "Active",
      issueDate: "2024-02-28",
      expiryDate: "2025-02-28"
    },
    {
      id: "agco12",
      businessName: "Food Basics",
      licenceType: "grocery",
      address: "1300 Lawrence Avenue West",
      city: "Toronto",
      postalCode: "M6A 1A3",
      municipality: "Toronto",
      ward: "York South-Weston",
      latitude: 43.7120,
      longitude: -79.4350,
      licenceNumber: "AGCO-4444",
      status: "Active",
      issueDate: "2024-03-15",
      expiryDate: "2025-03-15"
    },
    {
      id: "agco13",
      businessName: "Quick Mart",
      licenceType: "convenience",
      address: "510 Church Street",
      city: "Toronto",
      postalCode: "M4Y 2C1",
      municipality: "Toronto",
      ward: "Toronto Centre",
      latitude: 43.6620,
      longitude: -79.3810,
      licenceNumber: "AGCO-1111",
      status: "Active",
      issueDate: "2024-04-10",
      expiryDate: "2025-04-10"
    },
    {
      id: "agco14",
      businessName: "LCBO Agency - Yorkdale",
      licenceType: "lcbo_agency",
      address: "3401 Dufferin Street",
      city: "Toronto",
      postalCode: "M6A 2T9",
      municipality: "Toronto",
      ward: "York Centre",
      latitude: 43.7250,
      longitude: -79.4400,
      licenceNumber: "AGCO-7654",
      status: "Active",
      issueDate: "2024-01-10",
      expiryDate: "2025-01-10"
    },
    {
      id: "agco15",
      businessName: "FreshCo - Beer Wine",
      licenceType: "grocery",
      address: "2598 Eglinton Avenue West",
      city: "Toronto",
      postalCode: "M6N 1E2",
      municipality: "Toronto",
      ward: "York South-Weston",
      latitude: 43.7000,
      longitude: -79.4850,
      licenceNumber: "AGCO-3210",
      status: "Active",
      issueDate: "2024-02-25",
      expiryDate: "2025-02-25"
    },
    {
      id: "agco16",
      businessName: "Metro - Liquor Section",
      licenceType: "grocery",
      address: "245 Queen Street East",
      city: "Toronto",
      postalCode: "M5A 1S4",
      municipality: "Toronto",
      ward: "Toronto Centre",
      latitude: 43.6520,
      longitude: -79.3720,
      licenceNumber: "AGCO-1987",
      status: "Active",
      issueDate: "2024-03-20",
      expiryDate: "2025-03-20"
    },
    {
      id: "agco17",
      businessName: "Petro Canada - Wine Beer",
      licenceType: "convenience",
      address: "1400 Don Mills Road",
      city: "Toronto",
      postalCode: "M3B 3N6",
      municipality: "Toronto",
      ward: "Don Valley North",
      latitude: 43.7350,
      longitude: -79.3550,
      licenceNumber: "AGCO-5678",
      status: "Active",
      issueDate: "2024-04-05",
      expiryDate: "2025-04-05"
    },
    {
      id: "agco18",
      businessName: "LCBO Agency - Scarborough",
      licenceType: "lcbo_agency",
      address: "1850 Ellesmere Road",
      city: "Toronto",
      postalCode: "M1H 2V9",
      municipality: "Toronto",
      ward: "Scarborough Centre",
      latitude: 43.7780,
      longitude: -79.2350,
      licenceNumber: "AGCO-8642",
      status: "Active",
      issueDate: "2024-01-05",
      expiryDate: "2025-01-05"
    },
    {
      id: "agco19",
      businessName: "Longos - Wine Department",
      licenceType: "grocery",
      address: "475 Yonge Street",
      city: "Toronto",
      postalCode: "M2H 2M8",
      municipality: "Toronto",
      ward: "Willowdale",
      latitude: 43.7750,
      longitude: -79.4150,
      licenceNumber: "AGCO-2468",
      status: "Active",
      issueDate: "2024-02-10",
      expiryDate: "2025-02-10"
    },
    {
      id: "agco20",
      businessName: "Dollar Mart Liquor",
      licenceType: "convenience",
      address: "350 Danforth Avenue",
      city: "Toronto",
      postalCode: "M4K 1N1",
      municipality: "Toronto",
      ward: "Toronto-Danforth",
      latitude: 43.6810,
      longitude: -79.3550,
      licenceNumber: "AGCO-1357",
      status: "Active",
      issueDate: "2024-03-25",
      expiryDate: "2025-03-25"
    }
  ],
  total: 20,
  source: "seed_data"
};

async function getFromRedis(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const resp = await fetch(`${url}/get/${key}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.result;
  } catch {
    return null;
  }
}

async function setInRedis(key, value, ttlSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const pipeline = [
      ["SET", key, value],
      ["EXPIRE", key, ttlSeconds]
    ];
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(5000)
    });
    return resp.ok;
  } catch {
    return false;
  }
}

async function geocodeAddress(address) {
  try {
    const url = `/api/toronto-geocode?address=${encodeURIComponent(address)}`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.lat && data.lon) {
      return { lat: data.lat, lon: data.lon };
    }
    return null;
  } catch {
    return null;
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

async function fetchAndParseAGCOData() {
  try {
    const csvUrl = "https://agco.ca/sites/default/files/opendata/OpenDataGroceryAndConvenienceStoreLicences_En.csv";
    const resp = await fetch(csvUrl, {
      signal: AbortSignal.timeout(15000)
    });
    if (!resp.ok) return null;
    const csvText = await resp.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;
    const headers = parseCSVLine(lines[0]);
    const licences = [];
    const postalCodeIndex = headers.findIndex(h => h.toLowerCase().includes('postal'));
    const cityIndex = headers.findIndex(h => h.toLowerCase().includes('city'));
    const licenceNumberIndex = headers.findIndex(h => h.toLowerCase().includes('license number'));
    const licenceTypeIndex = headers.findIndex(h => h.toLowerCase().includes('licence type'));
    const premisesNameIndex = headers.findIndex(h => h.toLowerCase().includes('premises name'));
    const legalEntityIndex = headers.findIndex(h => h.toLowerCase().includes('legal entity'));
    const streetAddressIndex = headers.findIndex(h => h.toLowerCase().includes('street address'));
    const statusIndex = headers.findIndex(h => h.toLowerCase().includes('licence status'));
    const issueDateIndex = headers.findIndex(h => h.toLowerCase().includes('issue date'));
    const expiryDateIndex = headers.findIndex(h => h.toLowerCase().includes('expiry date'));

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;
      const postalCode = values[postalCodeIndex]?.toUpperCase().replace(/\s/g, '');
      if (!postalCode || !postalCode.startsWith('M')) continue;
      const city = values[cityIndex]?.trim() || '';
      const licenceNumber = values[licenceNumberIndex]?.trim() || '';
      const licenceType = values[licenceTypeIndex]?.trim() || '';
      const premisesName = values[premisesNameIndex]?.trim() || '';
      const legalEntity = values[legalEntityIndex]?.trim() || '';
      const streetAddress = values[streetAddressIndex]?.trim() || '';
      const status = values[statusIndex]?.trim() || '';
      const issueDate = values[issueDateIndex]?.trim() || '';
      const expiryDate = values[expiryDateIndex]?.trim() || '';

      const businessName = premisesName || legalEntity || '';
      const mappedLicenceType = licenceType.toLowerCase().includes('grocery') ? 'grocery' : 'convenience';

      licences.push({
        id: `agco-${licenceNumber}`,
        businessName,
        licenceType: mappedLicenceType,
        address: streetAddress,
        city,
        postalCode,
        municipality: city,
        ward: null,
        latitude: null,
        longitude: null,
        licenceNumber,
        status,
        issueDate,
        expiryDate
      });
    }
    return licences;
  } catch (error) {
    console.error("Error fetching AGCO CSV:", error);
    return null;
  }
}

async function handler(_req) {
  const now = new Date().toISOString();

  try {
    // Try cache first
    const cached = await getFromRedis(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return jsonResponse(parsed, 200, {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      });
    }

    // Fetch and parse AGCO CSV data
    const licences = await fetchAndParseAGCOData();

    if (!licences || licences.length === 0) {
      // Return seed data as fallback
      const responseData = {
        licences: SEED_AGCO_DATA.licences,
        total: SEED_AGCO_DATA.licences.length,
        lastUpdated: now,
        source: "seed_data",
        warning: "Could not fetch live AGCO data, using seed data"
      };

      const responseBody = JSON.stringify(responseData);
      await setInRedis(CACHE_KEY, responseBody, CACHE_TTL_SECONDS);

      return jsonResponse(responseData, 200, {
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Access-Control-Allow-Origin": "*",
        "X-Using-Seed-Data": "true"
      });
    }

    // Geocode addresses (limit to prevent timeout)
    const maxGeocode = 50;
    for (let i = 0; i < Math.min(licences.length, maxGeocode); i++) {
      if (!licences[i].latitude && licences[i].address) {
        const geo = await geocodeAddress(`${licences[i].address}, ${licences[i].city}, Ontario`);
        if (geo) {
          licences[i].latitude = geo.lat;
          licences[i].longitude = geo.lon;
        }
      }
    }

    const responseData = {
      licences,
      total: licences.length,
      lastUpdated: now,
      source: "agco_live",
      geocoded: Math.min(licences.length, maxGeocode)
    };

    const responseBody = JSON.stringify(responseData);
    await setInRedis(CACHE_KEY, responseBody, CACHE_TTL_SECONDS);

    return jsonResponse(responseData, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    console.error("AGCO Licences API error:", error);
    // Return seed data as fallback
    return jsonResponse({
      licences: SEED_AGCO_DATA.licences,
      total: SEED_AGCO_DATA.licences.length,
      lastUpdated: now,
      source: "seed_data",
      error: error.message
    }, 200, {
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
      "X-Using-Seed-Data": "true"
    });
  }
}

export {
  config,
  handler as default
};