# Build Plan: 20 Free Toronto Data Layers for WorldMonitor Toronto Variant

**Variant:** `toronto` (toronto.worldmonitor.app)
**Date:** 2026-03-24
**Stack:** Vanilla TypeScript + Vite, deck.gl (desktop) + D3 SVG (mobile), Vercel Edge Functions

---

## Existing Coverage

The Toronto variant already implements **13 layers** with full service + Edge Function + dual-map rendering:

| Existing Layer | Service | Edge Function | Map Key |
|---|---|---|---|
| Fire Incidents | `toronto-fire.ts` | `toronto-fire.js` | `toronto_fire_incidents` |
| DineSafe | `toronto-dinesafe.ts` | `toronto-dinesafe.js` | `toronto_dinesafe` |
| 311 Service Stress | `toronto-311.ts` | `toronto-311.js` | `toronto_311_stress` |
| Development Pipeline | `toronto-development.ts` | `toronto-development.js` | `toronto_development` |
| Water Level | `toronto-water-level.ts` | `toronto-water-level.js` | `toronto_water_level` |
| Earthquakes | `canada-earthquakes.ts` | `canada-earthquakes.js` | `toronto_earthquakes` |
| Air Traffic | `toronto-airtraffic.ts` | `toronto-airtraffic.js` | `toronto_air_traffic` |
| Ontario Roads | `ontario-roads.ts` | `ontario-511.js` | `ontario_roads` |
| Ontario Floods (TRCA) | `trca-floods.ts` | `trca-floods.js` | `ontario_floods` |
| Ontario Weather Alerts | `eccc-alerts.ts` | `eccc-ontario-alerts.js` | `ontario_weather_alerts` |
| Crime Delta | `toronto-crime.ts` | `toronto-crime.js` | (panel only) |
| Building Permits | `toronto-permits.ts` | `toronto-permits.js` | (panel only) |
| TTC Health | `ttc-health.ts` | `ttc-health.js` | (panel only) |

---

## Gap Analysis: 12 New Layers to Build

Of the 20 layers in the research doc, **8 overlap with existing implementations** (DineSafe, Building Permits, Earthquakes, TRCA Floods, Ontario Weather Alerts, etc.). The following **12 are new**:

| # | Layer | Type | Difficulty | Source |
|---|---|---|---|---|
| 1 | Toronto Public Library Branches | Static | Low | TPL KML |
| 2 | Toronto Community Housing | Static | Low | CKAN GeoJSON |
| 3 | Parks & Recreation Facilities | Static + Live Status | Low | CKAN GeoJSON + City JSON |
| 4 | AGCO Liquor Licences | Static | Medium | AGCO CSV (geocode) |
| 5 | Licensed Childcare Centres | Static | Medium | Ontario XLSX (geocode) |
| 6 | Vaccination / Flu Clinics | Dynamic (seasonal) | Medium | Ontario JSON (HTTP, geocode) |
| 7 | School Locations (All Boards) | Static | Low | CKAN GeoJSON |
| 8 | Green P Parking Lots | Static (stale) | Low | CKAN JSON (2019 frozen) |
| 9 | Cycling Network (Bikeways) | Geographic | Medium | ArcGIS FeatureServer |
| 10 | EV Charging Stations | Dynamic | Low | NREL API |
| 11 | Ravine Protection Areas | Geographic | Low | ArcGIS FeatureServer |
| 12 | Green Roof Permits | Semi-static | Medium | CKAN JSON (geocode) |

### Retired / Skipped (no viable API)

| Layer | Reason |
|---|---|
| Development Applications | Open data retired; AIC web-only with no API |
| Watermain Breaks | Data frozen at 2016; no current source |
| Solid Waste Schedule | Tabular only, no geospatial component |

---

## Implementation Tiers

### Tier 1 — Plug & Play (native GeoJSON, CORS, geocoded)
**Effort: ~2–3 days** | 4 layers

These are pure GeoJSON/JSON with CORS support and coordinates included. Follow existing static-layer patterns directly.

- [ ] **T1-1** — Toronto Community Housing buildings
- [ ] **T1-2** — Parks & Recreation Facilities (GeoJSON)
- [ ] **T1-3** — School Locations (All Boards)
- [ ] **T1-4** — Green P Parking Lots (2019 snapshot)

### Tier 2 — API Key or Format Conversion
**Effort: ~3–4 days** | 4 layers

Require a free API key or minor format handling. Follow existing dynamic-layer patterns.

- [ ] **T2-1** — EV Charging Stations (NREL API key)
- [ ] **T2-2** — Cycling Network (ArcGIS FeatureServer polyline GeoJSON)
- [ ] **T2-3** — Ravine Protection Areas (ArcGIS FeatureServer polygon GeoJSON)
- [ ] **T2-4** — Parks Live Operational Status (merge centres.json with static layer)

### Tier 3 — Geocoding or Significant Preprocessing
**Effort: ~4–5 days** | 4 layers

Require geocoding, format conversion (KML/XLSX), or proxy for CORS-blocked endpoints.

- [ ] **T3-1** — Toronto Public Library Branches (KML → GeoJSON, proxy, HTML description parsing)
- [ ] **T3-2** — Licensed Childcare Centres (XLSX → GeoJSON, geocode addresses)
- [ ] **T3-3** — Vaccination / Flu Clinics (HTTP-only JSON, geocode, seasonal)
- [ ] **T3-4** — AGCO Liquour Licences (limited CSV, geocode, filter Toronto)
- [ ] **T3-5** — Green Roof Permits (CKAN JSON, geocode)

---

## Ticket Breakdown

### T1-1: Toronto Community Housing Buildings

**Type:** Static Asset Layer | **Priority:** P2
**Source:** `https://ckan0.cf.opendata.inter.prod-toronto.ca/.../community-housing-data-4326.geojson`
**Format:** GeoJSON (EPSG:4326) | **CORS:** Supported | **Refresh:** Semi-annual

**Tasks:**
- [ ] Create `src/config/community-housing.ts` — typed interface + data array (or fetch-on-init)
- [ ] Add `communityHousing: boolean` to `MapLayers` interface in `src/types/index.ts:630`
- [ ] Add default `false` to all variant layer objects in `panels.ts` (FULL, TECH, FINANCE, HAPPY, COMMODITY, TORONTO + mobile variants)
- [ ] Add rendering in `DeckGLMap.ts > buildLayers()` — `ScatterplotLayer` or `IconLayer`
- [ ] Add rendering in `Map.ts > render()` — SVG circles
- [ ] Add help text in `Map.ts > buildHelpContent()`
- [ ] Add to `map-layer-definitions.ts` with icon + label + source
- [ ] Register in `RefreshScheduler` with monthly refresh (semi-annual data, monthly poll is fine)

**Panel Widget:**
- [ ] Create `src/components/CommunityHousingPanel.ts` — follow DineSafePanel pattern
  - Summary stats: total buildings, total units, count by building type (high-rise, walk-up, townhouse), count by region/district
  - List top 10 largest developments by unit count
  - Show occupancy data if available
- [ ] Register `community-housing` in `DEFAULT_PANELS` in `src/config/panels.ts`
- [ ] Add variant defaults: Toronto `true`, others `false`
- [ ] Wire data push in `App.ts` after service fetch → call `panel.setData(data)`

**Rollback:** Remove layer key from MapLayers, delete config file, remove map rendering blocks, delete panel class and config.

---

### T1-2: Parks & Recreation Facilities

**Type:** Static Asset Layer | **Priority:** P2
**Source (GeoJSON):** CKAN package `cbea3a67-...`, GeoJSON resource `f6cdcd50-...`
**Source (Live Status):** `https://www.toronto.ca/data/parks/live/centres.json`
**Format:** GeoJSON + JSON | **CORS:** Supported | **Refresh:** Monthly (static) + real-time (status)

**Tasks:**
- [ ] Create `src/config/parks-recreation.ts` — typed interface for facilities + amenity flags
- [ ] Add `parksRecreation: boolean` to `MapLayers`
- [ ] Add defaults to all variant layer objects
- [ ] Render in `DeckGLMap.ts` — `IconLayer` with amenity-based icon mapping
- [ ] Render in `Map.ts` — SVG with amenity-based styling
- [ ] Create `src/services/parks-recreation.ts` — fetches GeoJSON + merges live centres.json status
- [ ] Create `api/parks-recreation.js` — Edge Function with Redis cache (monthly TTL)
- [ ] Add to `RefreshScheduler` — 30-day static refresh + 15-min live status check
- [ ] Add help text with amenity filter legend

**Panel Widget:**
- [ ] Create `src/components/ParksRecreationPanel.ts` — follow DineSafePanel pattern
  - Summary stats: total facilities, count by amenity type (pool, rink, gym, playground, etc.), live status counts (open/closed)
  - Amenity breakdown with filter buttons
  - List facilities with live status indicator (green=open, red=closed)
  - Show operations notes where available
- [ ] Register `parks-recreation` in `DEFAULT_PANELS` in `src/config/panels.ts`
- [ ] Add variant defaults: Toronto `true`, others `false`
- [ ] Wire data push in `App.ts` after service fetch → call `panel.setData(data)`

**Rollback:** Same pattern as T1-1.

---

### T1-3: School Locations (All Boards)

**Type:** Static Asset Layer | **Priority:** P3
**Source:** CKAN GeoJSON, datastore `02ef7447-...`
**Format:** GeoJSON (EPSG:4326) | **CORS:** Supported | **Refresh:** Infrequent

**Tasks:**
- [ ] Create `src/config/schools.ts` — interface with BOARD_NAME, SCHOOL_LEVEL, SCHOOL_TYPE fields
- [ ] Add `schools: boolean` to `MapLayers`
- [ ] Add defaults (Toronto variant: `true`, others: `false`)
- [ ] Render in `DeckGLMap.ts` — color by school board, size by school level
- [ ] Render in `Map.ts` — SVG circles with board coloring
- [ ] Create `src/services/schools.ts` + `api/schools.js` with Redis cache
- [ ] Add to `RefreshScheduler` — monthly refresh
- [ ] Add help text with board color legend
- [ ] Optionally: panel filtering by board, level, type

**Panel Widget:**
- [ ] Create `src/components/SchoolsPanel.ts` — follow DineSafePanel pattern
  - Summary stats: total schools, count by board (TDSB, TCDSB, private, etc.), count by level (elementary, secondary, combined)
  - Board breakdown with filter buttons
  - List top 20 schools by name with board/level info
  - Show school type distribution (public, Catholic, private)
- [ ] Register `schools` in `DEFAULT_PANELS` in `src/config/panels.ts`
- [ ] Add variant defaults: Toronto `true`, others `false`
- [ ] Wire data push in `App.ts` after service fetch → call `panel.setData(data)`

**Gotcha:** Portal shows "Retired" but CKAN backend is active — this is a known Toronto Open Data portal bug.

---

### T1-4: Green P Parking Lots (2019 Snapshot)

**Type:** Static Asset Layer | **Priority:** P4 (stale data)
**Source:** CKAN JSON `8549d588-...` (frozen 2019)
**Format:** JSON with lat/lng | **CORS:** May need proxy | **Refresh:** Never (frozen)

**Tasks:**
- [ ] Create `src/config/green-p-parking.ts` — typed interface from 2019 JSON fields
- [ ] Add `greenPParking: boolean` to `MapLayers`
- [ ] Add defaults (`false` everywhere)
- [ ] Render in `DeckGLMap.ts` — `IconLayer` with P icon
- [ ] Render in `Map.ts` — SVG markers
- [ ] Create `api/green-p-parking.js` — Edge Function to proxy + cache (CORS may block direct fetch)
- [ ] Add help text noting "data frozen at 2019 — locations approximate"
- [ ] Add link to live Green P map for current availability
- [ ] UI: add "⚠️ Data from 2019" badge to layer label

**Rollback:** Remove layer + proxy. Low risk — optional layer.

---

### T2-1: EV Charging Stations

**Type:** Dynamic Data Layer | **Priority:** P2
**Source:** NREL API `https://developer.nrel.gov/api/alt-fuel-stations/v1.json`
**Format:** JSON / GeoJSON (`&output=geojson`) | **CORS:** Supported | **Refresh:** 12 hours
**Auth:** Free API key required (`DEMO_KEY` for testing, register at developer.nrel.gov)

**Tasks:**
- [ ] Register NREL API key, add `NREL_API_KEY` to Vercel env + sidecar allowlist
- [ ] Create `src/services/ev-charging.ts` — typed interface, LocalStorage caching, fetch with `&output=geojson`
- [ ] Create `api/ev-charging.js` — Edge Function with Redis cache (12h TTL)
- [ ] Add `evCharging: boolean` to `MapLayers`
- [ ] Add defaults (Toronto variant: `true`, full: `false`)
- [ ] Add state + setter in `DeckGLMap.ts` — `ScatterplotLayer` sized by connector count
- [ ] Add state + setter in `Map.ts` — SVG circles
- [ ] Wire lazy-load in `App.ts > handleLayerChange()`
- [ ] Add to `RefreshScheduler` — 12-hour interval
- [ ] Add help text with connector type legend (Level 2, DC Fast)
- [ ] Optionally: panel with charger count, network breakdown, pricing info

---

### T2-2: Cycling Network (Bikeways)

**Type:** Geographic Feature Layer | **Priority:** P2
**Source:** ArcGIS FeatureServer `cot_geospatial2/FeatureServer/49`
**Format:** GeoJSON (`?f=geojson&outSR=4326`) | **CORS:** Supported | **Refresh:** Semi-annual

**Tasks:**
- [ ] Create `src/services/cycling-network.ts` — fetch from ArcGIS, type streets by INFRA_HIGH
- [ ] Create `api/cycling-network.js` — Edge Function with Redis cache (7-day TTL)
- [ ] Add `cyclingNetwork: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`, others: `false`)
- [ ] Render in `DeckGLMap.ts` — `PathLayer` with color by infrastructure type (Cycle Track = green, Buffered Lane = blue, Bike Lane = orange)
- [ ] Render in `Map.ts` — D3 SVG paths with type coloring
- [ ] Add to `RefreshScheduler` — 7-day interval
- [ ] Add help text with comfort level legend
- [ ] Add zoom threshold (show at zoom >= 12 for readability)

---

### T2-3: Ravine & Natural Feature Protection Areas

**Type:** Geographic Feature Layer | **Priority:** P3
**Source:** ArcGIS FeatureServer `cot_geospatial13/FeatureServer/70`
**Format:** GeoJSON (`?f=geojson&outSR=4326`) | **CORS:** Supported | **Refresh:** Static (bylaw amendments only)

**Tasks:**
- [ ] Create `src/services/ravine-protection.ts` — fetch from ArcGIS
- [ ] Create `api/ravine-protection.js` — Edge Function with Redis cache (30-day TTL)
- [ ] Add `ravineProtection: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`, others: `false`)
- [ ] Render in `DeckGLMap.ts` — `GeoJsonLayer` with green fill, low opacity
- [ ] Render in `Map.ts` — D3 SVG polygons
- [ ] Add to `RefreshScheduler` — 30-day interval
- [ ] Add help text with bylaw reference

---

### T2-4: Parks Live Operational Status

**Type:** Dynamic Enhancement (extends T1-2) | **Priority:** P2
**Source:** `https://www.toronto.ca/data/parks/live/centres.json`
**Format:** JSON | **CORS:** Verify | **Refresh:** 15 minutes

**Tasks:**
- [ ] Extend `src/services/parks-recreation.ts` to fetch `centres.json` and merge with static GeoJSON
- [ ] Add live status rendering — green dot (open) vs red dot (closed) overlay on static markers
- [ ] Add status to tooltip/popup: "Pool: Open 6am-9pm", "Arena: Closed for maintenance"
- [ ] Add to `RefreshScheduler` — 15-minute live status check (separate from 30-day static refresh)
- [ ] Add loading indicator for live status fetch

---

### T3-1: Toronto Public Library Branches

**Type:** Static Asset Layer | **Priority:** P3
**Source:** `https://www.torontopubliclibrary.ca/data/library-data.kml`
**Format:** KML | **CORS:** Blocked (proxy required) | **Refresh:** On branch changes

**Tasks:**
- [ ] Create `api/tpl-libraries.js` — Edge Function to fetch KML, convert to GeoJSON server-side (or client-side with `toGeoJSON` library)
- [ ] Parse HTML `<description>` tags for structured address fields (regex or DOMParser)
- [ ] Create `src/services/tpl-libraries.ts` — typed interface, LocalStorage cache
- [ ] Add `libraries: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `true`, others: `false`)
- [ ] Render in `DeckGLMap.ts` — `IconLayer` with library/book icon
- [ ] Render in `Map.ts` — SVG markers
- [ ] Add to `RefreshScheduler` — 7-day refresh
- [ ] Add help text noting "branch locations only, no hours/services in current source"
- [ ] Optionally: add `toGeoJSON` as a dependency for client-side KML parsing

---

### T3-2: Licensed Childcare Centres

**Type:** Static Asset Layer | **Priority:** P3
**Source:** Ontario Ministry of Education XLSX at `data.ontario.ca`
**Format:** XLSX | **CORS:** N/A (file download) | **Refresh:** Monthly
**Requires:** Geocoding (no lat/lon in source)

**Tasks:**
- [ ] Create `api/childcare.js` — Edge Function: download XLSX, parse with SheetJS, filter by Toronto (CMSM = "Toronto"), geocode addresses via `toronto-geocode.js` helper, cache result
- [ ] Create `src/services/childcare.ts` — typed interface, LocalStorage cache
- [ ] Add `childcare: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false` — geocoding dependency)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer`
- [ ] Render in `Map.ts` — SVG circles
- [ ] Add to `RefreshScheduler` — 30-day refresh
- [ ] Add help text noting "geocoded from addresses — accuracy may vary"
- [ ] Add `sheetjs` / `xlsx` dependency if not already present

**Risk:** Geocoding ~500+ Toronto addresses. Use existing `toronto-geocode.js` helper. Batch geocode with rate limiting.

---

### T3-3: Vaccination / Flu Clinics

**Type:** Dynamic Layer (Seasonal) | **Priority:** P4
**Source:** `http://files.ontario.ca/flu/data.json` (HTTP, not HTTPS)
**Format:** JSON | **CORS:** Blocked + mixed content | **Refresh:** Daily (Oct–Mar only)
**Requires:** Geocoding, HTTPS proxy

**Tasks:**
- [ ] Create `api/flu-clinics.js` — Edge Function: fetch via HTTP (server-side), geocode, filter Toronto, cache 24h
- [ ] Create `src/services/flu-clinics.ts` — typed interface, LocalStorage cache, seasonal gate (only fetch Oct–Mar)
- [ ] Add `fluClinics: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`, seasonal)
- [ ] Render in `DeckGLMap.ts` — `IconLayer` with medical cross icon
- [ ] Render in `Map.ts` — SVG markers
- [ ] Add to `RefreshScheduler` — 24-hour interval, conditional on season
- [ ] Add help text noting "seasonal: Oct–Mar flu season only"
- [ ] Auto-hide layer toggle outside flu season

---

### T3-4: AGCO Liquor Licences (Convenience/Grocery)

**Type:** Static Asset Layer | **Priority:** P4
**Source:** `https://www.agco.ca/en/alcohol/list-convenience-and-grocery-store-retail-licences` (CSV)
**Format:** CSV | **CORS:** N/A (file download) | **Refresh:** Quarterly
**Requires:** Geocoding, Toronto filtering

**Tasks:**
- [ ] Create `api/agco-licences.js` — Edge Function: download CSV, parse, filter municipality = Toronto, geocode via `toronto-geocode.js`, cache 7-day
- [ ] Create `src/services/agco-licences.ts` — typed interface, LocalStorage cache
- [ ] Add `liquorLicences: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `IconLayer`
- [ ] Render in `Map.ts` — SVG markers
- [ ] Add to `RefreshScheduler` — 7-day refresh
- [ ] Add help text noting "convenience/grocery licences only — bars/restaurants not included"

**Limitation:** This is the weakest dataset in the set (limited scope, no comprehensive coverage). Low priority.

---

### T3-5: Green Roof Permits

**Type:** Semi-Static Layer | **Priority:** P3
**Source:** CKAN datastore `936ea65d-...`
**Format:** JSON / CSV | **CORS:** Supported | **Refresh:** Weekly
**Requires:** Geocoding (address-based, no lat/lon)

**Tasks:**
- [ ] Create `api/green-roof-permits.js` — Edge Function: fetch from CKAN, geocode addresses, cache 7-day
- [ ] Create `src/services/green-roof-permits.ts` — typed interface with permit area, type (bylaw vs voluntary), status
- [ ] Add `greenRoofPermits: boolean` to `MapLayers`
- [ ] Add defaults (Toronto: `false`)
- [ ] Render in `DeckGLMap.ts` — `ScatterplotLayer` with size by green roof area
- [ ] Render in `Map.ts` — SVG circles
- [ ] Add to `RefreshScheduler` — 7-day refresh
- [ ] Add help text noting "Green Roof Bylaw revoked Nov 2025 — voluntary applications only"
- [ ] Optionally: panel showing total green roof area trend over time

---

## Enhancement Tickets (Existing Layers)

These improve already-implemented layers based on research findings:

- [ ] **E-1** — DineSafe: Add SQL endpoint support for filtered queries (severity, date range) — reduce 130K row payload
- [ ] **E-2** — Building Permits: Add GEO_ID join with Toronto Address Points for geocoding (currently address-based)
- [ ] **E-3** — TRCA Floods: Add TRCA water quality monitoring from DataStream API (station-level parameter readings)
- [ ] **E-4** — MSC GeoMet Weather Radar: Add as WMS tile overlay on Toronto map (6-min radar refresh) — currently `weatherRadar` exists but may need enhancement

---

## Polling Interval Summary

| Layer | Interval | Source |
|---|---|---|
| Parks Live Status | 15 min | `centres.json` |
| MSC GeoMet Radar | 6 min | WMS tiles |
| USGS Earthquakes (existing) | 5 min | GeoJSON feed |
| DineSafe (existing) | 24 hours | CKAN datastore |
| Building Permits (existing) | 24 hours | CKAN datastore |
| EV Charging Stations | 12 hours | NREL API |
| Green Roof Permits | 7 days | CKAN datastore |
| AGCO Licences | 7 days | AGCO CSV |
| Parks & Rec (static) | 30 days | CKAN GeoJSON |
| Schools | 30 days | CKAN GeoJSON |
| Community Housing | 30 days | CKAN GeoJSON |
| Cycling Network | 7 days | ArcGIS FeatureServer |
| Ravine Protection | 30 days | ArcGIS FeatureServer |
| Green P Parking | Never | Frozen 2019 |
| Flu Clinics | 24 hours (Oct–Mar) | Ontario JSON |
| Childcare | 30 days | Ontario XLSX |
| Library Branches | 7 days | TPL KML |

---

## Dependencies

- `toGeoJSON` — client-side KML parsing (T3-1: Library Branches)
- `SheetJS` (`xlsx`) — XLSX parsing (T3-2: Childcare)
- `NREL_API_KEY` — free API key registration (T2-1: EV Charging)
- Existing `api/toronto-geocode.js` — batch geocoding helper (T3-2, T3-3, T3-4, T3-5)
- Upstash Redis — all dynamic layer caching

---

## Effort Estimate

| Tier | Layers | Est. Days | Cumulative |
|---|---|---|---|
| Tier 1 (Plug & Play) | 4 | 2–3 | 3 |
| Tier 2 (API / Format) | 4 | 3–4 | 7 |
| Tier 3 (Geocode / Preprocess) | 5 | 4–5 | 12 |
| Enhancements | 4 | 2–3 | 15 |
| **Total** | **17 tickets** | **~12–15 days** | |

---

## Implementation Order (Recommended)

1. **T1-1** Community Housing — easiest GeoJSON, validates the static-layer pattern
2. **T1-3** Schools — same pattern, different data
3. **T2-3** Ravine Protection — introduces ArcGIS FeatureServer pattern
4. **T2-2** Cycling Network — reuses ArcGIS pattern, adds PathLayer
5. **T2-1** EV Charging — first API-key layer, validates dynamic pattern
6. **T1-2** Parks & Rec + **T2-4** Live Status — combined static + dynamic
7. **T1-4** Green P Parking — low effort, frozen data
8. **T3-5** Green Roof Permits — introduces geocoding via existing helper
9. **T3-1** Library Branches — KML + proxy pattern
10. **T3-2** Childcare — XLSX + geocode batch
11. **T3-3** Flu Clinics — seasonal conditional logic
12. **T3-4** AGCO — lowest value, last
13. **E-1 through E-4** — enhancements to existing layers

---

## Known Gotchas (from research)

1. **Toronto Open Data "Retired" bug** — Portal shows "Retired" for active datasets (Parks, Schools, Building Permits, Bikeways). Always check CKAN `package_show` API, not the portal UI.
2. **CKAN datastore default limit** — 100 rows. Always append `&limit=32000` for bulk exports.
3. **ArcGIS `outSR=4326`** — Default spatial reference is EPSG:3857. Always add `&outSR=4326` for WGS84.
4. **HTTP-only endpoints** — `files.ontario.ca` uses HTTP. Proxy via Edge Function (mixed content blocked in browsers).
5. **Green Roof Bylaw revoked** — Ontario revoked the enabling City of Toronto Act section on Nov 3, 2025. Voluntary applications continue but bylaw-mandated permits have effectively stopped.

---

## Panel Widget Requirements

The following layers should include accompanying panel widgets for data summaries and detailed views:

| Ticket | Panel ID | Panel Name | Summary Stats | Key Features |
|--------|----------|------------|---------------|--------------|
| **T1-1** | `community-housing` | Community Housing | Total buildings, units, by type (high-rise/walk-up/townhouse), by region | Top 10 largest developments, occupancy data |
| **T1-2** | `parks-recreation` | Parks & Recreation | Total facilities, by amenity type, live status (open/closed) | Amenity filter buttons, live status indicators, operations notes |
| **T1-3** | `schools` | Schools | Total schools, by board (TDSB/TCDSB/private), by level (elementary/secondary) | Board/type breakdown, top 20 schools list |
| **T2-1** | `ev-charging` | EV Charging | Total stations, by connector type (Level 2/DC Fast), by network | Network breakdown, pricing info, availability |
| **T3-1** | `libraries` | Library Branches | Total branches, by type (regional/neighborhood) | Branch list with address, hours (if available) |
| **T3-2** | `childcare` | Childcare Centres | Total centres, by age group, by operator type | Capacity/occupancy stats, licensing status |
| **T3-3** | `flu-clinics` | Flu Clinics | Total clinics, by vaccine type, dates active | Seasonal (Oct–Mar), clinic status, appointment info |
| **T3-4** | `agco-licences` | Liquor Licences | Total licences, by licence type (convenience/grocery) | Address list, licence expiry dates |
| **T3-5** | `green-roof-permits` | Green Roof Permits | Total permits, by permit type (bylaw/voluntary), by year | Total area trend, permit status breakdown |

### No Panel Required (map-only layers)

- **T1-4** Green P Parking — static locations only, no dynamic data
- **T2-2** Cycling Network — geographic lines, no summary stats needed
- **T2-3** Ravine Protection — static boundary polygons
- **T2-4** Parks Live Status — merged into Parks & Rec panel

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

Adding panel widgets adds **~4–6 hours per panel** (class + config + wiring). With 9 panels, this adds **~2–3 days** to the total effort.

**Revised Total Effort:** ~14–18 days (up from ~12–15 days)
