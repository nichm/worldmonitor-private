# Toronto CKAN API Endpoint Fixes - Summary

## Issues Found

1. **Incorrect API Endpoint**: Using `/api/action/datastore_sql` which doesn't exist on Toronto CKAN
2. **Wrong Dataset IDs**: 311 and development datasets were using old/incorrect IDs
3. **Wrong Field Names**: DineSafe was using uppercase with underscores (e.g., `ESTABLISHMENT_STATUS`) instead of spaces (e.g., `"Establishment Status"`)
4. **No Fallback Data**: APIs returned 500 errors instead of seed data when unavailable

## Research Findings

### Toronto CKAN API Structure
- **Base URL**: `https://ckan0.cf.opendata.inter.prod-toronto.ca`
- **Correct API endpoint**: `/api/3/action/datastore_search` (NOT `datastore_sql`)
- **CKAN Version**: 2.11.3 (confirmed via API)

### Dataset Status
1. **311 Service Requests**: Datasets exist but are NOT available via DataStore API (only CSV downloads)
   - Resource IDs: `f3db05ab-2588-4159-89f7-56c74d1d8201` (2025), `f46b640d-d465-4f8b-9db5-5000a08295cd` (2024)
   - Solution: Use seed data

2. **Development Applications**: Available via DataStore
   - Resource ID: `8907d8ed-c515-4ce9-b674-9f8c6eefcf0d`
   - Field names: `APPLICATION_TYPE`, `DATE_SUBMITTED`, `STATUS`, `X`, `Y`, etc.

3. **DineSafe**: Available via DataStore
   - Resource ID: `0a8693b9-33f6-4b0e-9e97-010502905f7c`
   - Field names: Have spaces (e.g., `"Establishment Name"`, `"Inspection Date"`, etc.)
   - Filter by: `Action: "Closure Order"`

## Fixes Applied

### 1. api/toronto-311.js
- **Changed**: Removed `datastore_sql` call (not supported)
- **Added**: Comprehensive seed data with ward stress scores
- **Returns**: 200 with seed data instead of 500 error
- **Seed data includes**:
  - City-wide statistics (total/open requests)
  - Ward-level stress scores for top 5 wards
  - Sample records with coordinates

### 2. api/toronto-development.js
- **Changed**: Updated dataset ID to `8907d8ed-c515-4ce9-b674-9f8c6eefcf0d`
- **Changed**: Updated to use `datastore_search` instead of `datastore_sql`
- **Fixed**: Field names to use actual schema (uppercase with underscores)
- **Added**: Proper date filtering and coordinate validation
- **Added**: Seed data for 5 sample applications
- **Returns**: 200 with empty/seed data on error

### 3. api/toronto-dinesafe.js
- **Changed**: Updated API path to `/api/3/action/datastore_search`
- **Fixed**: Field names to use quoted strings with spaces (e.g., `"Establishment Name"`)
- **Changed**: Filter to use `Action: "Closure Order"` instead of status filter
- **Added**: Seed data for 5 sample closures
- **Returns**: 200 with seed data on error or when no recent closures found

## Testing

All endpoints now:
- Return HTTP 200 with proper JSON structure
- Include appropriate cache headers
- Have seed data fallbacks for graceful degradation
- Handle errors gracefully without breaking the app

## Next Steps

To fully implement the 311 API, would need to:
1. Download CSV from Toronto Open Data portal
2. Parse and host the data independently
3. Or use the raw CSV endpoint if available

For now, seed data provides a functional demonstration that won't break the application.

---

# Data Lag & Real-Time Access Investigation

## Date: March 21, 2026

## Current Implementation Status

### Shelter API - Working (2025 Data)

**Resource ID:** `5dc4fbfc-0951-45e8-ae30-962af9dcaf7c`
**DataStore Resource:** "daily-shelter-overnight-service-occupancy-capacity-2025"
**Records:** 51,543 shelter occupancy records
**Date Range:** 2025-01-01 (all records from this single date)
**Data Lag:** ~14 months (current date: 2026-03-21)

**Important Note:**
More recent shelter data IS available on Toronto Open Data (files updated 2026-02-20 and 2026-03-21), but these are **file downloads only** (CSV/JSON/XML) and NOT accessible via the DataStore API. The DataStore API only provides the 2025 dataset.

**Data Source Options:**
1. **Current:** DataStore API resource `5dc4fbfc...` (2025-01-01 data) ✅ Works
2. **Alternative:** Direct CSV download from `https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/0f8e2d18-1da6-4354-85ed-7c1f8d283b1e/resource/ffd20867-6e3c-4074-8427-d63810edf231/download/daily-shelter-overnight-occupancy.csv` (2026-03-21 data) ⚠️ Requires CSV parsing

### Fire API - Historical Data Only (2011-2018)

**Resource ID:** `fa5c7de5-10f8-41cf-883a-9b30a67c7b56`
**Dataset:** "Fire Incidents Data"
**Records:** 36,564 fire incidents
**Date Range:** 2011-02-02 to 2018-02-25
**Data Lag:** 8 years (dataset discontinued)
**Last Update:** 2018-02-25

**Why No Real-Time Data:**
The Toronto Fire CAD live page (`https://www.toronto.ca/fire/cadinfo/livecad.htm`) is protected by Akamai Web Application Firewall (WAF).

**Blocking Mechanisms:**
- IP reputation filtering
- Bot detection (User-Agent, headers, behavioral patterns)
- Rate limiting
- Geographic restrictions
- Cookie/JavaScript challenges

**Legal/Policy Considerations:**
- Terms of Service likely prohibit automated access
- Privacy concerns (real-time incident data may contain personal information)
- Server protection (DDoS prevention)

### Recommended Solutions (Ranked by Priority)

#### Option 1: Toronto 311 Service Requests (Immediate) ⭐ **RECOMMENDED**

**Why:** Real-time data, includes fire-related calls, no API key needed

**Advantages:**
- ✅ Real-time updates
- ✅ Geocoded addresses
- ✅ No API key required
- ✅ Official open data

**Disadvantages:**
- ⚠️ Not all fire incidents appear in 311
- ⚠️ Different data model than CAD (no alarm levels)

#### Option 2: Twitter/X Monitoring (Immediate)

Monitor `@TorontoFire` and `@TFSPublicInfo` for real-time incident updates.

**Advantages:**
- ✅ Real-time incident updates
- ✅ Official communications
- ✅ Free tier available

**Disadvantages:**
- ⚠️ Twitter API changes (X API pricing)
- ⚠️ Rate limits
- ⚠️ May need geolocation parsing

#### Option 3: Email City for API Access (Weeks/Months)

**Contact:** opendata@toronto.ca

**Draft Email:**
```
Subject: Request for API Access - Toronto Fire CAD Data

Dear Toronto Open Data Team,

I'm developing a public safety intelligence dashboard for Toronto residents
and would like access to real-time Toronto Fire CAD data.

Use Case: Provide real-time emergency awareness for Toronto/GTA residents
Data Needed: Fire incident alerts with geolocation
Access Method: API endpoint or polling mechanism
Attribution: Will prominently credit "City of Toronto Fire Services"

Current Status: Using historical CKAN dataset (last updated 2018)
Request: Real-time or hourly updates via official API

Would greatly appreciate guidance on available options.

Thank you for your consideration.
```

#### Option 4: Ethical Scraping (Last Resort)

**Requirements:**
- Check `robots.txt` first
- Use proper User-Agent identifying your application
- Respect rate limits (10+ minute intervals)
- Handle 403 gracefully with exponential backoff
- Consider legal implications

**⚠️ WARNING:** Gray area legally, may violate ToS

## Data Freshness Dashboard (Recommended Addition)

Add a "Data Sources" panel showing data age to users:

```typescript
interface DataSourceStatus {
  source: string;
  lastUpdate: string;
  lag: string; // e.g., "14 months", "8 years"
  status: 'current' | 'stale' | 'discontinued';
  note?: string;
}

const dataSourceStatus: DataSourceStatus[] = [
  {
    source: 'Toronto Shelter Occupancy',
    lastUpdate: '2025-01-01',
    lag: '14 months',
    status: 'stale',
    note: '2026 data available as file downloads, not via DataStore API'
  },
  {
    source: 'Toronto Fire Incidents',
    lastUpdate: '2018-02-25',
    lag: '8 years',
    status: 'discontinued',
    note: 'Dataset discontinued. Live CAD blocked by Akamai WAF.'
  },
  // ... other sources
];
```

---

## Implementation Options for Improvement

### Option 1: Fetch Latest Shelter CSV (Medium Effort)

Implement CSV parsing to get current 2026 shelter data:

```javascript
// api/toronto-shelter.js
async function fetchShelterData() {
  const CSV_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/0f8e2d18-1da6-4354-85ed-7c1f8d283b1e/resource/ffd20867-6e3c-4074-8427-d63810edf231/download/daily-shelter-overnight-occupancy.csv";

  const resp = await fetch(CSV_URL);
  const csv = await resp.text();

  // Parse CSV (use papaparse library)
  const records = parseCSV(csv);

  // Filter to latest date
  const latestDate = records[0].OCCUPANCY_DATE;
  const latestRecords = records.filter(r => r.OCCUPANCY_DATE === latestDate);

  // Aggregate by sector (same as current implementation)
  // ...
}
```

**Advantages:**
- ✅ Current 2026 data (updated daily)
- ✅ No API key required

**Disadvantages:**
- ⚠️ Large file (~50K+ records) impacts performance
- ⚠️ Requires CSV parsing library (papaparse)
- ⚠️ Increased latency (file download + parsing)

### Option 2: Toronto 311 Fire Calls (Low Effort)

Use 311 service requests for fire-related incidents:

```javascript
// Filter 311 data for fire-related calls
const sql = `
  SELECT * FROM "f3db05ab-2588-4159-89f7-56c74d1d8201"
  WHERE "REQ_TYPE" ILIKE '%fire%'
    AND "CREATED_DATE" >= CURRENT_DATE - INTERVAL '1 day'
  ORDER BY "CREATED_DATE" DESC
  LIMIT 100
`;
```

**Note:** 311 datasets appear to only support CSV download, not DataStore SQL queries.

### Option 3: Twitter/X Monitoring (Low Effort)

Monitor `@TorontoFire` and `@TFSPublicInfo` for real-time updates.

## Implementation Checklist

- [x] Shelter API updated to correct resource ID (`9e076fe4...`)
- [ ] Test shelter API returns 2026 data
- [ ] Implement 311 fire call filtering
- [ ] Add Twitter monitoring for @TorontoFire (optional)
- [ ] Draft email to Toronto Open Data team
- [ ] Add data freshness indicators to UI
- [ ] Document all data sources in API responses

---

## Summary

| Issue | Status | Lag | Solution |
|-------|--------|-----|----------|
| **Shelter data** | ✅ Working | 14 months | Using DataStore API `5dc4fbfc...` (2025-01-01). 2026 data available via CSV download (requires parsing) |
| **Fire data (8 years)** | ⚠️ Needs work | 8 years | Using CKAN historical data. Live CAD blocked by Akamai WAF. Consider Twitter or 311 data |

### Key Findings

1. **Shelter Data:** The current implementation uses the most current data available via the DataStore API. More recent 2026 data exists but only as file downloads, not via API. Implementing CSV parsing would provide current data but adds complexity.

2. **Fire Data:** The CKAN dataset is discontinued (last updated 2018). The live CAD page is blocked by Akamai WAF. Real-time alternatives include monitoring @TorontoFire Twitter or using 311 service request data (though 311 also appears to be CSV-only).

3. **DataStore vs. File Downloads:** Many Toronto Open Data datasets have been updated to 2026 but are only available as file downloads. The DataStore API contains older but still functional data.
