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
