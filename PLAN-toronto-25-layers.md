# Build Plan: 25 Free Toronto Data Layers — Expanded Set (Round 2)

**Variant:** `toronto` (toronto.worldmonitor.app)
**Date:** 2026-03-24
**Supersedes:** Overlaps with `PLAN-toronto-20-layers.md` — see cross-reference below

---

## Cross-Reference with Round 1 Plan

The 25-layer doc overlaps significantly with the 20-layer doc. This plan covers **only the net-new layers** not already ticketed in Round 1.

| Status | Layer | Notes |
|---|---|---|
| **Already in Round 1** | EV Charging Stations | T2-1 |
| **Already in Round 1** | Cycling Network (Bikeways) | T2-2 |
| **Already in Round 1** | Ravine Protection Areas | T2-3 |
| **Already in Round 1** | Green Roof Permits | T3-5 |
| **Already exists in codebase** | DineSafe | `toronto-dinesafe.ts` + panel |
| **Already exists** | Building Permits | `toronto-permits.ts` + panel |
| **Already exists** | 311 Service Requests | `toronto-311.ts` + panel |
| **Already exists** | Toronto Earthquakes | `canada-earthquakes.ts` |
| **Already exists** | TRCA Floods | `trca-floods.ts` + panel |
| **Already exists** | Ontario Weather Alerts | `eccc-alerts.ts` + Edge Function |
| **Already exists** | Ontario Roads (511) | `ontario-roads.ts` + `ontario-511.js` |
| **Already exists** | Shelter Capacity | `toronto-shelter.ts` + `ShelterGaugePanel` |
| **Already exists** | Toronto Fire | `toronto-fire.ts` + Edge Function |
| **Already exists** | TTC Health | `ttc-health.ts` (GTFS-RT alerts) |
| **Already exists** | Air Traffic (OpenSky) | `toronto-airtraffic.ts` + `opensky.js` |
| **Already exists** | Toronto Crime | `toronto-crime.ts` + `TorontoCrimePanel` |
| **Already exists** | Development Pipeline | `toronto-development.ts` + panel |
| **NEW — this plan** | TTC Real-Time Vehicle Positions | Net new |
| **NEW** | TTC Service Alerts (GTFS-RT) | Enhancement to TTC Health |
| **NEW** | Toronto Police Crime Incidents (MCI ArcGIS) | Net new (differs from existing crime panel) |
| **NEW** | TPS Police Division Boundaries | Net new |
| **NEW** | City Council Votes & Ward Boundaries | Net new |
| **NEW** | Election Data & Polling Locations | Net new |
| **NEW** | Neighbourhood Profiles & Demographics | Net new |
| **NEW** | Federal Riding Boundaries | Net new |
| **NEW** | Court & Judicial Facility Locations | Net new |
| **NEW** | ML&S Violations (beyond DineSafe) | Net new |
| **NEW** | Traffic Signals & Signal Locations | Net new |
| **NEW** | Road Construction & Closures | Net new |
| **NEW** | Toronto Hydro Power Outages | Net new (reverse-engineer) |
| **NEW** | ECCC Air Quality Health Index (AQHI) | Net new |
| **NEW** | Flooding Composite (311 + TRCA) | Enhancement to existing floods |
| **NEW** | Tree Canopy & Green Space GIS | Net new |
| **NEW** | Great Lakes Water Levels (Lake Ontario) | Net new |
| **NEW** | Ontario Wildfire & Fire Risk | Net new (enhancement to existing `fires`) |
| **NEW** | Toronto Urban Heat Island | Net new (research data) |
| **NEW** | Bike Share (GBFS) | Net new |
| **NEW** | Protest & Demonstration Events | Net new (custom pipeline) |
| **SKIPPED** | Green P Parking | Already in Round 1 (T1-4) |
| **SKIPPED** | Development Applications | Retired, no API |
| **SKIPPED** | Watermain Breaks | Data frozen 2016 |
| **SKIPPED** | Solid Waste Schedule | Not geospatial |

---

## Net-New Layers: 20 Tickets

### Tier 1 — Plug & Play (native GeoJSON/JSON, CORS, minimal work)
**Effort: ~3–4 days** | 5 layers

---

### N1: Toronto Police Crime Incidents (MCI ArcGIS)

**Type:** Dynamic Data Layer | **Priority:** P1
**Source:** TPS ArcGIS Portal — `services.arcgis.com/.../Major_Crime_Indicators_Open_Data/FeatureServer/0`
**Endpoint:** `https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson`
**Format:** GeoJSON (native) | **CORS:** Supported | **Refresh:** Quarterly

**Why this is different from existing `toronto-crime.ts`:** Existing crime service shows aggregated category deltas in a panel. This adds actual **point-level crime incident markers on the map** with MCI category, date, and neighbourhood — enabling spatial heatmap/cluster visualization.

**Tasks:**
- [ ] Create `src/services/toronto-crime-incidents.ts` — fetch from TPS ArcGIS, LocalStorage cache
- [ ] Create `api/toronto-crime-incidents.js` — Edge Function with Redis cache (24h TTL)
- [ ] Add `crimeIncidents: boolean` to `MapLayers` in `src/types/index.ts`
- [ ] Add defaults (Toronto: `true`, others: `false`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` with color by MCI_CATEGORY (Assault=red, B&E=orange, Auto Theft=yellow, Robbery=purple, Theft Over=blue)
- [ ] Render in `Map.ts` — SVG circles
- [ ] Add click handler → popup with date, category, division, neighbourhood
- [ ] Add to `RefreshScheduler` — 6-hour interval (quarterly data, poll conservatively)
- [ ] Add help text with category color legend
- [ ] Add time filter (last 30 days, 90 days, 1 year) in layer options

**Gotcha:** Locations deliberately offset to nearest road intersection for privacy. Document in help text.

**Rollback:** Remove layer key, delete service + Edge Function, remove map rendering.

---

### N2: TPS Police Division Boundaries

**Type:** Geographic Feature Layer | **Priority:** P2
**Source:** TPS ArcGIS Portal
**Endpoint:** `https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Police_Divisions/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson`
**Format:** GeoJSON (native) | **CORS:** Supported | **Refresh:** Static

**Tasks:**
- [ ] Create `src/services/police-divisions.ts` — fetch ArcGIS GeoJSON, cache locally
- [ ] Add `policeDivisions: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `GeoJsonLayer` with semi-transparent blue fill, division labels
- [ ] Render in `Map.ts` — D3 SVG polygons
- [ ] Click → popup with division name, area name
- [ ] Joinable with N1 (crime incidents) via DIVISION field for aggregate stats
- [ ] Add help text: "16 TPS divisions — click for area info"

---

### N3: Federal Riding Boundaries

**Type:** Geographic Feature Layer | **Priority:** P3
**Source:** Elections Canada Open Data
**Format:** Shapefile → GeoJSON (pre-process) | **CORS:** N/A (static download) | **Refresh:** Static (redistricting cycle)

**Tasks:**
- [ ] Download SHP from Elections Canada, filter to Ontario + Toronto bounding box, convert to GeoJSON (one-time, commit to `src/config/`)
- [ ] Create `src/config/federal-ridings.ts` — typed interface + static GeoJSON data
- [ ] Add `federalRidings: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`, full variant: maybe `false`)
- [ ] Render in `DeckGLMap.ts` — `GeoJsonLayer` with light boundary lines
- [ ] Render in `Map.ts` — D3 SVG paths
- [ ] Add riding name labels
- [ ] Add help text: "343 federal electoral districts (2023 Representation Order)"

**Gotcha:** Nationwide file (~10MB). Must filter + reproject from NAD83 Lambert to WGS84. Use `ogr2ogr` or `mapshaper` for preprocessing.

---

### N4: Court & Judicial Facility Locations

**Type:** Static Asset Layer | **Priority:** P4
**Source:** Manual compilation from ontario.ca/courts + ontariocourts.ca
**Format:** Hand-built GeoJSON | **CORS:** N/A | **Refresh:** Rarely

**Tasks:**
- [ ] Manually compile ~15 Toronto-area court locations into `src/config/court-facilities.ts`
- [ ] Fields: name, address, court type (Superior, Provincial, Small Claims, Family), lat/lng
- [ ] Add `courtFacilities: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `IconLayer` with ⚖️ icon
- [ ] Render in `Map.ts` — SVG markers
- [ ] Click → popup with court name, type, address

**Effort:** ~1 hour for data compilation. Small layer.

---

### N5: ML&S Investigation Activity

**Type:** Dynamic Data Layer | **Priority:** P3
**Source:** Toronto CKAN — `municipal-licensing-and-standards-investigation-activity`
**Endpoint:** CKAN datastore_search + ArcGIS
**Format:** JSON/CSV | **CORS:** CKAN needs proxy | **Refresh:** Monthly

**Note:** This extends beyond DineSafe to cover bylaw enforcement (noise, zoning, property standards, etc.).

**Tasks:**
- [ ] Create `api/mls-investigations.js` — Edge Function proxy to CKAN datastore
- [ ] Create `src/services/mls-investigations.ts` — typed interface, geocode addresses via `toronto-geocode.js`
- [ ] Add `mlsInvestigations: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` colored by investigation type
- [ ] Render in `Map.ts` — SVG circles
- [ ] Add to `RefreshScheduler` — 7-day interval
- [ ] Add help text: "Bylaw enforcement activity — noise, property standards, zoning"

---

### Tier 2 — API Integration or Moderate Work
**Effort: ~4–5 days** | 5 layers

---

### N6: TTC Real-Time Vehicle Positions (GTFS-RT)

**Type:** Dynamic Data Layer | **Priority:** P1 (highest-value new layer)
**Source:** TTC GTFS-RT — `https://gtfsrt.ttc.ca/vehiclepositions`
**Format:** Protocol Buffers (binary) | **CORS:** N/A (protobuf) | **Refresh:** 15–30 seconds

**Why P1:** This is the single best real-time feed in the Toronto data ecosystem. Live moving vehicles on the map.

**Tasks:**
- [ ] Add `gtfs-rt-bindings` dependency (JS protobuf parser)
- [ ] Create `api/ttc-vehicles.js` — Edge Function: fetch protobuf, decode to JSON, cache 30s Redis TTL, return vehicle positions array
- [ ] Requires matching against static GTFS schedule for route names — fetch `stops.txt` and `routes.txt` at startup
- [ ] Create `src/services/ttc-vehicles.ts` — typed interface (vehicle_id, trip_id, route_id, lat, lng, bearing, speed, timestamp)
- [ ] Add `ttcVehicles: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` with heading arrow, color by route type (subway=red, streetcar=green, bus=blue)
- [ ] Render in `Map.ts` — SVG circles (simplified for mobile)
- [ ] Wire into `RefreshScheduler` — 15-second polling (watch Redis cache TTL)
- [ ] Add help text: "Real-time TTC vehicle positions — buses and streetcars. Updated every 15s."
- [ ] Add zoom threshold (show at zoom >= 13 — too dense at city-wide zoom)
- [ ] Optionally: filter by route ID in layer options

**Architecture note:** Protobuf decoding MUST happen server-side (Edge Function). Browser cannot parse protobuf directly from CORS-blocked endpoint.

**Rollback:** Remove layer + Edge Function + dependency.

---

### N7: ECCC Air Quality Health Index (AQHI)

**Type:** Dynamic Data Layer | **Priority:** P2
**Source:** ECCC OGC API
**Endpoint:** `https://api.weather.gc.ca/collections/aqhi-observations-realtime`
**Format:** GeoJSON via OGC API | **CORS:** Likely supported | **Refresh:** Hourly

**Tasks:**
- [ ] Create `src/services/aqhi.ts` — fetch OGC API, filter for Toronto stations (onaq-001, onaq-018), cache
- [ ] Create `api/aqhi.js` — Edge Function with Redis cache (1h TTL)
- [ ] Add `aqhi: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` with color by AQHI category (1-3=green, 4-6=yellow, 7-10=orange, 10+=red), size by value
- [ ] Render in `Map.ts` — SVG circles
- [ ] Click → popup with station name, AQHI value, category, timestamp
- [ ] Add to `RefreshScheduler` — hourly
- [ ] Add help text: "Air Quality Health Index — hourly readings. 1=Low risk, 10+=Very High risk."
- [ ] Optionally: panel with all Toronto station readings + trend chart
- [ ] Optionally: IDW interpolation for continuous AQHI surface (advanced)

**Gotcha:** Limited station density in Toronto. Note in help text that values are point observations, not area averages.

---

### N8: Great Lakes Water Levels (Lake Ontario at Toronto)

**Type:** Dynamic Data Layer | **Priority:** P2
**Source:** Canadian Hydrographic Service IWLS API
**Endpoint:** `https://api-iwls.dfo-mpo.gc.ca/api/v1/stations/13320/data` (Toronto station)
**Format:** JSON | **CORS:** Likely supported | **Refresh:** 3–5 minutes

**Tasks:**
- [ ] Create `src/services/lake-ontario-level.ts` — fetch time series from CHS, cache recent readings
- [ ] Create `api/lake-ontario-level.js` — Edge Function with Redis cache (5min TTL)
- [ ] Add `lakeOntarioLevel: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — single marker at station 13320 with tooltip showing current level
- [ ] Click → popup with water level (m), datum reference (IGLD 1985), timestamp
- [ ] Add to `RefreshScheduler` — 5-minute interval
- [ ] Implement retry/backoff on 429 (CHS rate limits)
- [ ] Add help text: "Lake Ontario water level — station 13320. Reference: IGLD 1985 datum."

**Note:** Extends existing `toronto-water-level.ts` (which likely covers a different source). Coordinate with existing water level panel.

---

### N9: Neighbourhood Profiles & Demographics (Choropleth)

**Type:** Geographic Feature Layer | **Priority:** P2
**Source:** Toronto CKAN — `neighbourhoods` (boundaries) + `neighbourhood-profiles` (2021 Census data)
**Format:** GeoJSON (boundaries) + CSV/XLSX (profiles) | **CORS:** CKAN proxy needed | **Refresh:** Static (5-year census cycle)

**Tasks:**
- [ ] Download neighbourhood boundary GeoJSON from CKAN, preprocess into `src/config/neighbourhoods.ts`
- [ ] Pre-process key demographic metrics from profiles CSV (population, median income, dwelling types, etc.) into a lookup by neighbourhood ID
- [ ] Add `neighbourhoods: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`)
- [ ] Render in `DeckGLMap.ts` — `GeoJsonLayer` with choropleth fill (selectable metric: population density, median income, etc.)
- [ ] Render in `Map.ts` — SVG polygons with fill
- [ ] Add metric selector in layer options
- [ ] Click → popup with full neighbourhood profile stats
- [ ] Add help text: "2021 Census neighbourhood profiles — 158 neighbourhoods. Select metric from layer options."

**Gotcha:** Profiles CSV has 2,600+ columns. Pre-process server-side, select ~20 useful metrics.

---

### N10: City Council Votes & Ward Boundaries

**Type:** Geographic Feature + Tabular Data | **Priority:** P3
**Source:** CKAN — `members-of-toronto-city-council-voting-record` + `city-wards`
**Format:** GeoJSON (wards) + Datastore JSON (votes) | **CORS:** CKAN proxy | **Refresh:** Per council meeting

**Tasks:**
- [ ] Download 25-ward boundary GeoJSON from CKAN, preprocess into `src/config/city-wards.ts`
- [ ] Create `api/council-votes.js` — Edge Function proxy to CKAN datastore for voting records
- [ ] Create `src/services/council-votes.ts` — fetch recent votes, join to ward boundaries
- [ ] Add `cityWards: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `GeoJsonLayer` for ward boundaries, color by recent vote alignment
- [ ] Click → popup with councillor name, recent votes
- [ ] Add to `RefreshScheduler` — 24-hour interval
- [ ] Add help text: "25 city wards with council voting records (2022–2026 term)"

---

### Tier 3 — Significant Preprocessing / Reverse Engineering
**Effort: ~5–7 days** | 10 layers

---

### N11: Road Construction & Closures (Reverse-Engineered)

**Type:** Dynamic Data Layer | **Priority:** P2
**Source:** City of Toronto Road Restrictions Map (RoDARS backend)
**Format:** JSON (reverse-engineered XHR endpoint) | **CORS:** City servers | **Refresh:** 60–300 seconds

**Tasks:**
- [ ] Reverse-engineer the backend JSON endpoint from the Road Restrictions Map XHR requests
- [ ] Create `api/road-restrictions.js` — Edge Function proxy with aggressive caching (5min Redis)
- [ ] Create `src/services/road-restrictions.ts` — typed interface (restriction type, street, intersections, dates, impact)
- [ ] Add `roadRestrictions: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` for point restrictions, `PathLayer` for linear closures
- [ ] Color by type: construction=orange, event=purple, closure=red
- [ ] Add to `RefreshScheduler` — 5-minute interval
- [ ] Add help text: "~400+ active road restrictions. Updated daily for planned, near-real-time for RESCU incidents."
- [ ] **Fragility warning:** Reverse-engineered endpoint may change without notice. Build resilient fallback (show last cached data on error).

**Note:** Critical for FIFA World Cup 2026 (May–July 2026 in Toronto) — expect 2-3x normal restriction volume.

---

### N12: Toronto Hydro Power Outages (Reverse-Engineered)

**Type:** Dynamic Data Layer | **Priority:** P3
**Source:** Toronto Hydro Outage Map (`outagemap.torontohydro.com`)
**Format:** JSON (reverse-engineered from JS app XHR) | **CORS:** Unknown | **Refresh:** 5 minutes

**Tasks:**
- [ ] Reverse-engineer the internal JSON endpoint from Toronto Hydro's outage map
- [ ] Create `api/toronto-hydro-outages.js` — Edge Function proxy with Redis cache (5min TTL)
- [ ] Create `src/services/toronto-hydro-outages.ts` — typed interface (outage area, customers affected, cause, ETA, status)
- [ ] Add `powerOutages: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`)
- [ ] Render in `DeckGLMap.ts` — `PolygonLayer` or `ScatterplotLayer` for outage zones
- [ ] Color: red (active), orange (restoring), green (resolved)
- [ ] Click → popup with affected customers, cause, estimated restoration
- [ ] Add to `RefreshScheduler` — 5-minute interval
- [ ] Implement graceful degradation: if endpoint changes, show last cached data with "data may be stale" warning
- [ ] **ToS risk:** Scraping may violate ToS. Document risk. Consider using `poweroutage.com/ca/province/ontario` as alternative.

---

### N13: Traffic Signal Locations

**Type:** Static Asset Layer | **Priority:** P3
**Source:** Toronto CKAN — `traffic-signals-tabular`
**Format:** CSV/JSON | **CORS:** CKAN proxy | **Refresh:** Static

**Tasks:**
- [ ] Create `api/traffic-signals.js` — Edge Function proxy to CKAN
- [ ] Create `src/services/traffic-signals.ts` — fetch signal locations, geocode if needed
- [ ] Add `trafficSignals: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` with small dots
- [ ] Add to `RefreshScheduler` — 30-day refresh
- [ ] Note: no real-time congestion data available publicly (see gotcha)

---

### N14: Tree Canopy & Green Space GIS

**Type:** Geographic / Raster Layer | **Priority:** P4
**Source:** Toronto CKAN — `forest-and-land-cover`
**Format:** Raster (GeoPackage) | **CORS:** N/A | **Refresh:** Static (next update ~2028)

**Tasks:**
- [ ] Download Forest & Land Cover GeoPackage, pre-process into vector tileset (Tippecanoe) or static GeoJSON summary
- [ ] For web rendering, create simplified canopy percentage per neighbourhood polygon (join with N9 boundaries)
- [ ] Add `treeCanopy: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `GeoJsonLayer` with green choropleth (canopy % per area)
- [ ] If full raster needed: serve as XYZ tile layer from CDN
- [ ] Add help text: "Forest & Land Cover (2018 snapshot). Tree canopy % by area."

**Gotcha:** Raster files are large. Browser cannot render raw GeoPackage. Must pre-process to vector tiles or simplified polygons. Street tree inventory dataset is "Retired" — confirm current source.

---

### N15: Ontario Wildfire & Fire Risk Zones

**Type:** Dynamic Data Layer | **Priority:** P2 (seasonal)
**Source:** CWFIS / NRCan — `cwfis.cfs.nrcan.gc.ca`
**Endpoints:**
- WMS: `https://cwfis.cfs.nrcan.gc.ca/geoserver/public/wms?layers=activefires_current`
- CSV: `https://cwfis.cfs.nrcan.gc.ca/downloads/activefires/`
**Format:** WMS tiles + CSV | **CORS:** Varies | **Refresh:** Daily (fires), 15-60 min (hotspots)

**Tasks:**
- [ ] Create `api/wildfire-ontario.js` — Edge Function: fetch active fires CSV, filter for Ontario bounding box, parse lat/lng
- [ ] Create `src/services/wildfire-ontario.ts` — typed interface (fire name, agency, lat, lng, size ha, stage)
- [ ] Add `ontarioWildfires: boolean` to `MapLayers`
- [ ] Add defaults (full: `true`, Toronto: `true` — smoke/affects GTA)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` with fire icon, size by area, color by stage (of fire=red, being held=orange, under control=yellow)
- [ ] Click → popup with fire name, size, agency, start date
- [ ] Optionally: add WMS tile overlay for fire danger index raster
- [ ] Add to `RefreshScheduler` — 1-hour interval
- [ ] Add help text: "Active Ontario wildfires + CWFIS fire danger. May affect GTA air quality."

**Note:** Extends existing `wildfires` layer which covers global fires. This adds Ontario-specific detail.

---

### N16: Flooding Composite (Enhancement)

**Type:** Dynamic + Geographic | **Priority:** P2
**Source:** Multiple — 311 flooding complaints + TRCA flood zones + basement study areas

**This enhances existing `ontario_floods` / `trca-floods.ts`:**

**Tasks:**
- [ ] Extend `api/trca-floods.js` to also fetch TRCA flood plain polygons from ArcGIS Hub
- [ ] Add 311 flooding complaint overlay — filter 311 service requests for "Flooding" / "Basement Flooding" types
- [ ] Geocode 311 flooding complaints (address-based) via `toronto-geocode.js`
- [ ] Render flood zone polygons (static) + complaint points (dynamic) in separate sub-layers
- [ ] Add complaint spike detection — alert when 311 flooding complaints exceed baseline (e.g., during storms)
- [ ] Add to `RefreshScheduler` — complaint overlay 1-hour, flood zone polygons 30-day

---

### N17: Election Data & Polling Locations

**Type:** Static Asset Layer | **Priority:** P4 (event-driven)
**Source:** Mixed — Elections Canada SHP, City CKAN voter stats, polling station web pages (scrape)

**Tasks:**
- [ ] Federal ridings: reuse N3 boundary data
- [ ] Create `api/election-data.js` — Edge Function: fetch CKAN voter statistics, parse
- [ ] Polling locations: scrape City election page or create manual GeoJSON (~500+ locations)
- [ ] Add `electionData: boolean` to `MapLayers`
- [ ] Add defaults (`false` — enable during election periods)
- [ ] Render ridings + polling station markers
- [ ] Auto-show during election periods (Oct 2025 municipal, future federal)

**Note:** Low ongoing value, high value during election periods. Consider as a seasonal feature toggle.

---

### N18: Protest & Demonstration Events (Custom Pipeline)

**Type:** Dynamic Data Layer | **Priority:** P3
**Source:** Custom pipeline — ACLED, GDELT, TPS news releases, City events calendar

**Tasks:**
- [ ] Create `api/protests.js` — Edge Function: aggregate from multiple sources
  - ACLED API (registration required) — filter for Toronto protest events
  - GDELT events database — filter by location=Toronto, event type=protest
  - TPS news releases — scrape `/media-centre/news-releases/` for demonstration-related posts
- [ ] Create `src/services/protests.ts` — normalize events from multiple sources
- [ ] Add `protests: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` with protest icon
- [ ] Click → popup with event description, date, source, attendees (if available)
- [ ] Add to `RefreshScheduler` — 1-hour interval
- [ ] **Warning:** ACLED requires registration. GDELT coverage is uneven. Low confidence on completeness.

---

### N19: Bike Share (GBFS)

**Type:** Dynamic Data Layer | **Priority:** P3
**Source:** Bike Share Toronto / PBSC — GBFS feed
**Format:** JSON (GBFS v2.x) | **CORS:** Likely supported | **Refresh:** 1–5 minutes

**Tasks:**
- [ ] Locate Bike Share Toronto GBFS endpoint (standard: `gbfs.{domain}/gbfs.json` → discovery → `station_information.json` + `station_status.json`)
- [ ] Create `src/services/bike-share.ts` — fetch station info + live status, merge
- [ ] Create `api/bike-share.js` — Edge Function with Redis cache (2min TTL)
- [ ] Add `bikeShare: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` with size by bike count, color by availability (green=has bikes, red=empty, grey=offline)
- [ ] Render in `Map.ts` — SVG circles
- [ ] Add to `RefreshScheduler` — 2-minute interval
- [ ] Add help text: "Live Bike Share Toronto station status — available bikes and docks."
- [ ] Add zoom threshold (zoom >= 14)

---

### N20: Toronto Urban Heat Island

**Type:** Static / Research Layer | **Priority:** P4
**Source:** U of T School of Cities, HealthyPlan.City, NRCan thermal studies
**Format:** Research raster outputs (no standard API) | **CORS:** Varies | **Refresh:** Static snapshots

**Tasks:**
- [ ] Request or download heat vulnerability raster from U of T School of Cities
- [ ] Pre-process into vector tileset or simplified polygon GeoJSON
- [ ] Alternative: derive proxy UHI layer from tree canopy (N14) + land cover + building density
- [ ] Add `urbanHeatIsland: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `GeoJsonLayer` with heat choropleth (blue=cool, red=hot)
- [ ] Add help text: "Urban Heat Island vulnerability — research data snapshot. Not real-time."
- [ ] Document data provenance and date prominently

**Risk:** No official City API. Data access requires contacting research owners. Low reliability.

---

## Enhancement Tickets (Existing Layers)

- [ ] **E-5** — TTC Health panel: Add vehicle position sub-layer (connect to N6 GTFS-RT)
- [ ] **E-6** — Toronto Crime panel: Add map point layer from N1 (MCI ArcGIS) alongside existing delta panel
- [ ] **E-7** — Existing `fires` layer: Add Ontario wildfire detail from N15 (CWFIS)
- [ ] **E-8** — TRCA Floods: Add flood zone polygons + 311 complaint overlay from N16
- [ ] **E-9** — Weather Alerts: Add AQHI station readings alongside ECCC alerts (connect to N7)
- [ ] **E-10** — Development Pipeline: Add Green Roof Permit data from Round 1 T3-5

---

## Polling Interval Summary (Combined)

| Layer | Interval | Protocol |
|---|---|---|
| TTC Vehicle Positions | 15 seconds | Protobuf → JSON (server) |
| OpenSky Flights (existing) | 15 seconds | REST (existing) |
| ECCC Weather Alerts (existing) | 1–5 min | CAP-CP XML (existing) |
| Ontario 511 (existing) | 30 seconds | REST JSON (existing) |
| Road Restrictions | 5 minutes | Reverse-engineered JSON |
| Toronto Hydro Outages | 5 minutes | Reverse-engineered JSON |
| CHS Lake Ontario Level | 5 minutes | REST JSON |
| Bike Share (GBFS) | 2 minutes | GBFS JSON |
| ECCC AQHI | 1 hour | OGC API GeoJSON |
| Wildfire Hotspots | 1 hour | CSV + WMS tiles |
| Crime Incidents (MCI) | 6 hours | ArcGIS GeoJSON |
| 311 / Shelter / DineSafe (existing) | 1 hour | CKAN datastore |
| Neighbourhood Demographics | 30 days | Static GeoJSON |
| Tree Canopy | Never | Static raster/tiles |
| Urban Heat Island | Never | Static raster/tiles |

---

## Effort Estimate (Net-New Only)

| Tier | Tickets | Est. Days |
|---|---|---|
| Tier 1 (Plug & Play) | N1–N5 | 3–4 |
| Tier 2 (API / Moderate) | N6–N10 | 4–5 |
| Tier 3 (Preprocess / Reverse-Engineer) | N11–N20 | 5–7 |
| Enhancements | E-5–E-10 | 2–3 |
| **Total (Round 2 net-new)** | **20 + 6 enhancements** | **~14–19 days** |

**Combined with Round 1:** ~26–34 days total for 32 new layers + 10 enhancements across both plans.

---

## Implementation Order (Recommended)

**Week 1 — Highest impact:**
1. **N6** TTC Vehicle Positions (P1 — best real-time feed, high user value)
2. **N1** Crime Incidents MCI (P1 — map-level crime visualization)
3. **N7** ECCC AQHI (P2 — public health relevance)
4. **N11** Road Restrictions (P2 — FIFA 2026 prep)

**Week 2 — Infrastructure & context:**
5. **N2** TPS Division Boundaries (pairs with N1)
6. **N9** Neighbourhood Demographics (choropleth value)
7. **N8** Lake Ontario Water Level (complements existing water level panel)
8. **N15** Ontario Wildfires (seasonal priority)
9. **N19** Bike Share GBFS (high user interest)

**Week 3 — Remaining civic layers:**
10. **N5** ML&S Investigations
11. **N10** Council Votes & Wards
12. **N3** Federal Riding Boundaries
13. **N16** Flooding Composite (enhancement)
14. **N13** Traffic Signals

**Week 4 — Reverse-engineering & research:**
15. **N12** Toronto Hydro Outages
16. **N18** Protest Events (custom pipeline)
17. **N4** Court Facilities (quick)
18. **N17** Election Data
19. **N14** Tree Canopy
20. **N20** Urban Heat Island

---

## Known Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Road Restrictions endpoint changes | N11 breaks | Cache aggressively, graceful fallback |
| Toronto Hydro blocks scraping | N12 fails | Use `poweroutage.com` as fallback |
| GTFS-RT protobuf schema changes | N6 breaks | Pin gtfs-rt-bindings version, monitor |
| ACLED/GDELT API changes or rate limits | N18 unreliable | Multiple source aggregation |
| CKAN "Retired" datasets disappear | Multiple layers | Verify via `package_show` API before each build |
| Research data unavailable (UHI) | N20 blocked | Derive proxy from canopy + land cover |
| FIFA 2026 road restriction volume spike | N11 performance | Pre-scale Redis cache, add pagination |

---

## Panel Widget Requirements

The following layers should include accompanying panel widgets for data summaries and detailed views:

| Ticket | Panel ID | Panel Name | Summary Stats | Key Features |
|--------|----------|------------|---------------|--------------|
| **N1** | `crime-incidents` | Crime Incidents (MCI) | Total incidents, by MCI category, by division, by month | Trend chart, category color legend, time filter |
| **N5** | `mls-investigations` | ML&S Investigations | Total investigations, by type (noise/zoning/property standards), by ward | Recent activity list, status breakdown |
| **N6** | `ttc-vehicles` | TTC Vehicles | Active vehicles, by route type (subway/streetcar/bus), by route | Live count, vehicle status, route list |
| **N7** | `aqhi` | Air Quality (AQHI) | Station readings, city average, by AQHI category | Station list, trend chart, health guidance |
| **N9** | `neighbourhoods` | Neighbourhood Profiles | Population, median income, dwelling types, by neighbourhood | Metric selector, top/bottom neighborhoods |
| **N10** | `council-votes` | Council Votes | Recent votes, by councillor, by outcome (Yes/No/Absent) | Vote alignment heatmap, meeting dates |
| **N11** | `road-restrictions` | Road Restrictions | Total restrictions, by type (construction/event/closure), by impact | Severity breakdown, duration stats |
| **N12** | `hydro-outages` | Hydro Outages | Active outages, customers affected, by area, by cause | Outage map summary, ETA tracking |
| **N15** | `ontario-wildfires` | Ontario Wildfires | Active fires, by stage (of fire/being held/under control), by agency | Fire size ranking, proximity to GTA |
| **N19** | `bike-share` | Bike Share | Active stations, bikes available, docks available, by station | Station status list, system summary |
| **N20** | `tree-canopy` | Tree Canopy | Canopy % by neighbourhood, total canopy area | Neighborhood ranking, canopy trend |

### No Panel Required (map-only layers)

- **N2** TPS Police Division Boundaries — static polygons, click popup sufficient
- **N3** Federal Riding Boundaries — static polygons, click popup sufficient
- **N4** Court Facilities — static points, small dataset
- **N8** Lake Ontario Water Level — single point, existing water level panel covers this
- **N13** Traffic Signals — static points, no dynamic data
- **N14** Urban Heat Island — raster/choropleth, no point data for panel
- **N16** Flooding Composite — extends existing TRCA Floods panel
- **N17** Election Data — event-driven, seasonal, not needed continuously
- **N18** Protest Events — custom pipeline, data quality uncertain

### Panel Implementation Pattern

Follow `DineSafePanel.ts` as the reference:

1. **Create panel class** in `src/components/[Name]Panel.ts`:
   - Extend `Panel` base class
   - Constructor with `id`, `title`, `infoTooltip`
   - `setData(data: Type[])` method to receive data from `App.ts`
   - `renderContent()` method to build HTML
   - Summary stats section with key metrics
   - Data list/table (top 10–20 items)
   - Filter buttons where applicable

2. **Register in config** (`src/config/panels.ts`):
   - Add entry to `DEFAULT_PANELS` object
   - Set `enabled: true` for Toronto variant, `false` for others
   - Set appropriate `priority` (1 = top of list)

3. **Add variant defaults** (`src/config/variants/toronto.ts`):
   - Import panel config
   - Add to `DEFAULT_PANELS` export

4. **Wire data push** (`src/App.ts`):
   - After service fetch, call `panel.setData(data)`
   - Pass same data type used by map rendering

### Effort Adjustment

Adding panel widgets adds **~4–6 hours per panel** (class + config + wiring). With 11 panels, this adds **~2–3 days** to the total effort.

**Revised Total Effort (Plan 2):** ~16–22 days (up from ~14–19 days)

**Combined Both Plans:** ~30–40 days (up from ~26–34 days)
