# Toronto Data Sources

This document catalogs all data sources used by the Toronto variant of WorldMonitor. Each layer is documented with its data source, upstream URL, update frequency, format, and status.

## Summary Table

| Layer Name | Edge Function | Data Source | Update Frequency | Format | Status |
|------------|---------------|-------------|------------------|--------|--------|
| toronto_fire_incidents | toronto-fire.js | Toronto Fire Services CAD | Real-time (5 min) | JSON | ⚠️ Partial (seed) |
| toronto_dinesafe | toronto-dinesafe.js | City of Toronto Open Data | Daily (24h) | JSON | ✅ Live |
| toronto_neighbourhoods | neighbourhoods.js | City of Toronto Open Data | Monthly (30d) | GeoJSON | ✅ Live |
| toronto_311_stress | toronto-311.js | City of Toronto 311 | N/A | JSON | ❌ Seed-only |
| toronto_development | toronto-development.js | City of Toronto Development | N/A | JSON | ❌ Seed-only |
| toronto_water_level | toronto-water-level.js | Toronto Water Level Data | N/A | JSON | ❌ Seed-only |
| ontario_spills | ontario-spills.js | Ontario Spills Data | Daily | JSON | ✅ Live |
| toronto_air_traffic | toronto-airtraffic.js | Toronto Air Traffic | N/A | JSON | ❌ Seed-only |
| ontario_roads | ontario-511.js | Ontario 511 Road Conditions | Real-time (5 min) | JSON | ✅ Live |
| ontario_weather_alerts | eccc-ontario-alerts.js | Environment Canada Weather Alerts | Real-time (5 min) | JSON | ✅ Live |
| ontario_floods | trca-floods.js | TRCA Flood Data | Hourly (1h) | JSON | ✅ Live |
| schools | schools.js | City of Toronto Open Data | Monthly (30d) | CSV | ✅ Live |
| communityHousing | ontario-housing.js | Ontario Housing Supply | N/A | JSON | ❌ Seed-only |
| greenPParking | green-p-parking.js | City of Toronto Open Data | Frozen (2019) | JSON | ⚠️ Partial (static) |
| parksRecreation | parks-recreation.js | City of Toronto Open Data + toronto.ca | Static geo + live status | GeoJSON | ✅ Live |
| evCharging | ev-charging.js | NREL Alternative Fuel Stations | Daily (12h) | JSON | ✅ Live |
| cyclingNetwork | cycling-network.js | Toronto ArcGIS | Weekly (7d) | GeoJSON | ✅ Live |
| ravineProtection | ravine-protection.js | Toronto ArcGIS | Monthly (30d) | GeoJSON | ✅ Live |
| crimeIncidents | toronto-crime-incidents.js | TPS ArcGIS (Major Crime Indicators) | Every 6h | GeoJSON | ✅ Live |
| policeDivisions | N/A | Toronto Police Divisions | Static | N/A | ❌ Seed-only |
| ecccAqhi | eccc-aqhi.js | Environment Canada AQHI | Hourly (1h) | JSON | ✅ Live |
| treeCanopy | tree-canopy.js | Toronto ArcGIS | Quarterly (90d) | GeoJSON | ✅ Live |
| lakeOntarioLevel | lake-ontario-level.js | Great Lakes Water Level Data | Daily | JSON | ✅ Live |
| bikeShare | bike-share.js | Toronto Bike Share GBFS | Real-time (2 min) | GBFS/JSON | ✅ Live |
| protestEvents | protest-events.js | CivicTechTO Events Feed | Daily (24h) | JSON | ⚠️ Partial |
| federalRidings | federal-ridings.js | Elections Canada ESRI | Monthly (30d) | GeoJSON | ✅ Live |
| mlsInvestigations | N/A | Toronto MLS Investigations | N/A | JSON | ❌ Seed-only |
| torontoHydroOutages | toronto-hydro-outages.js | Toronto Hydro (no public API) | N/A | JSON | ❌ Seed-only |
| trafficSignals | traffic-signals.js | City of Toronto CKAN | Daily (24h) | GeoJSON | ✅ Live |
| courtFacilities | court-facilities.js | Ontario Court of Justice | Static | JSON | ⚠️ Partial (static) |
| ttcRealtime | ttc-realtime.js | TTC GTFS-RT | Real-time (30 sec) | Protobuf | ✅ Live |
| roadConstruction | road-construction.js | City of Toronto Open Data | Real-time (5 min) | JSON | ✅ Live |
| ontarioWildfires | ontario-wildfires.js | Ontario Wildfire Data | Hourly (1h) | JSON | ✅ Live |
| floodingComposite | N/A | Composite flood data | Hourly | JSON | ✅ Live |
| childcare | childcare.js | Ontario Childcare Data | Monthly (30d) | JSON | ✅ Live |
| fluClinics | flu-clinics.js | Ontario Flu Clinics (no public API) | N/A | JSON | ❌ Seed-only |
| agcoLicences | agco-licences.js | AGCO Liquor Licences | Monthly (30d) | JSON | ✅ Live |
| greenRoofPermits | green-roof-permits.js | City of Toronto Open Data | N/A | JSON | ❌ Seed-only |
| libraryBranches | tpl-libraries.js | Toronto Public Library | Weekly (7d) | JSON | ✅ Live |
| electionData | N/A | Election Data | Static | JSON | ❌ Seed-only |
| urbanHeatIsland | urban-heat.js | Urban Heat Island Analysis | N/A | JSON | ❌ Seed-only |
| ttcVehicles | ttc-vehicles.js | TTC GTFS-RT | Real-time (30 sec) | Protobuf | ✅ Live |

---

## Per-Layer Details

### ✅ Live Data Sources

#### Crime Incidents
- **Layer:** `crimeIncidents`
- **Edge Function:** `api/toronto-crime-incidents.js`
- **Data Source:** Toronto Police Service Major Crime Indicators
- **Upstream URL:** `https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson`
- **Update Frequency:** Every 6 hours
- **Data Format:** GeoJSON via ArcGIS REST API
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data License
- **Notes:** Cached via Upstash Redis with 6-hour TTL. Includes MCI category, occurrence date, neighbourhood, and offence details.

#### DineSafe
- **Layer:** `toronto_dinesafe`
- **Edge Function:** `api/toronto-dinesafe.js`
- **Data Source:** City of Toronto DineSafe Inspections
- **Upstream URL:** `https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/b6b4f3fb-2e2c-47e7-931d-b87d22806948/resource/e9df9d33-727e-4758-9a84-67ebefec1453/download/dinesafe.json`
- **Update Frequency:** Daily (data updated daily by City of Toronto)
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data License
- **Notes:** 149,938+ inspection records. Returns latest inspection per establishment. In-memory 24-hour cache.

#### Bike Share
- **Layer:** `bikeShare`
- **Edge Function:** `api/bike-share.js`
- **Data Source:** Toronto Bike Share (PBSC)
- **Upstream URLs:**
  - Station Info: `https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information.json`
  - Station Status: `https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_status.json`
- **Update Frequency:** Real-time (2-minute cache)
- **Data Format:** GBFS (General Bikeshare Feed Specification) → JSON
- **Status:** ✅ Live
- **License/Attribution:** Open data via GBFS standard
- **Notes:** Merges static station info with live status. Cached via Upstash Redis with 2-minute TTL.

#### TTC Vehicles
- **Layer:** `ttcVehicles`
- **Edge Function:** `api/ttc-vehicles.js`
- **Data Source:** TTC GTFS-RT Vehicle Positions
- **Upstream URL:** `https://bustime.ttc.ca/gtfsrt/vehicles`
- **Update Frequency:** Real-time (30-second cache)
- **Data Format:** GTFS-RT Protobuf (binary) → decoded to JSON
- **Status:** ✅ Live
- **License/Attribution:** TTC Open Data / GTFS
- **Notes:** Custom protobuf decoder. Filters to Toronto bounding box. Max 500 vehicles. bbox filtering and deduplication.

#### TTC Real-Time
- **Layer:** `ttcRealtime`
- **Edge Function:** `api/ttc-realtime.js`
- **Data Source:** TTC GTFS-RT Feed
- **Upstream URL:** `https://bustime.ttc.ca/gtfsrt/vehicles`
- **Update Frequency:** Real-time (30-second cache)
- **Data Format:** GTFS-RT Protobuf
- **Status:** ✅ Live
- **License/Attribution:** TTC Open Data / GTFS
- **Notes:** Similar to ttcVehicles, potentially with additional real-time features.

#### EV Charging
- **Layer:** `evCharging`
- **Edge Function:** `api/ev-charging.js`
- **Data Source:** NREL Alternative Fuel Stations API
- **Upstream URL:** `https://developer.nrel.gov/api/alt-fuel-stations/v1.json?api_key={key}&fuel=ELEC&state=ON&limit=all&output=geojson`
- **Update Frequency:** Daily (12-hour cache)
- **Data Format:** GeoJSON
- **Status:** ✅ Live
- **License/Attribution:** NREL API (requires API key)
- **Notes:** Requires `NREL_API_KEY` environment variable. Falls back to seed data if API fails. Cached via Upstash Redis.

#### Road Construction
- **Layer:** `roadConstruction`
- **Edge Function:** `api/road-construction.js`
- **Data Source:** City of Toronto Road Restrictions
- **Upstream URL:** `https://secure.toronto.ca/opendata/cart/road_restrictions/v3?format=json`
- **Update Frequency:** Real-time (5-minute cache)
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data License
- **Notes:** Includes event title, type, classification, affected roads, dates, and status. Cached via Upstash.

#### Parks & Recreation
- **Layer:** `parksRecreation`
- **Edge Function:** `api/parks-recreation.js`
- **Data Source:** City of Toronto Open Data + Toronto.ca Live Status
- **Upstream URLs:**
  - Static GeoJSON: CKAN resource `f6cdcd50-da7b-4ede-8e60-c3cdba70b559`
  - Live Status: `https://www.toronto.ca/data/parks/live/centres.json`
- **Update Frequency:** Static (monthly) + live status (15-minute cache)
- **Data Format:** GeoJSON + JSON
- **Status:** ✅ Live (hybrid)
- **License/Attribution:** City of Toronto Open Data License
- **Notes:** Merges static facility locations with live open/closed status. Amenity detection (pools, rinks, gyms, playgrounds, etc.).

#### Air Quality (AQHI)
- **Layer:** `ecccAqhi`
- **Edge Function:** `api/eccc-aqhi.js`
- **Data Source:** Environment and Climate Change Canada AQHI Observations
- **Upstream URL:** `https://api.weather.gc.ca/collections/aqhi-observations-realtime/items?bbox=-79.7,43.5,-79.1,43.85&limit=100`
- **Update Frequency:** Hourly
- **Data Format:** GeoJSON
- **Status:** ✅ Live
- **License/Attribution:** Government of Canada (Open Data)
- **Notes:** Returns Air Quality Health Index readings for Toronto area. Summary stats by risk level.

#### Schools
- **Layer:** `schools`
- **Edge Function:** `api/schools.js`
- **Data Source:** City of Toronto School Locations (All Types)
- **Upstream URL:** `https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/02ef7447-54d9-4aa7-b76d-8ef8138ac546`
- **Update Frequency:** Monthly (30-day cache)
- **Data Format:** CSV
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data License
- **Notes:** Includes elementary, secondary, and private schools. Fields: name, address, postal code, type, coordinates.

#### Neighbourhoods
- **Layer:** `toronto_neighbourhoods`
- **Edge Function:** `api/neighbourhoods.js`
- **Data Source:** City of Toronto Neighbourhood Boundaries
- **Upstream URL:** `https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/fc443770-ef0a-4025-9c2c-2cb558bfab00/resource/0719053b-28b7-48ea-b863-068823a93aaa/download/neighbourhoods-4326.geojson`
- **Update Frequency:** Monthly (30-day cache)
- **Data Format:** GeoJSON
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data License
- **Notes:** 140 neighbourhood boundaries. Cached via Upstash Redis.

#### Cycling Network
- **Layer:** `cyclingNetwork`
- **Edge Function:** `api/cycling-network.js`
- **Data Source:** Toronto ArcGIS Cycling Infrastructure
- **Upstream URL:** `https://gis.toronto.ca/arcgis/rest/services/cot_geospatial2/FeatureServer/49/query?f=json&outSR=4326&where=1%3D1&outFields=*`
- **Update Frequency:** Weekly (7-day cache)
- **Data Format:** GeoJSON via ArcGIS REST API
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data
- **Notes:** Includes cycle tracks, buffered lanes, bike lanes, sharrows, multi-use paths. LineString and MultiLineString support.

#### Ravine Protection
- **Layer:** `ravineProtection`
- **Edge Function:** `api/ravine-protection.js`
- **Data Source:** Toronto ArcGIS Ravine Protection Areas
- **Upstream URL:** `https://gis.toronto.ca/arcgis/rest/services/cot_geospatial13/FeatureServer/70/query?f=geojson&outSR=4326&where=1%3D1&outFields=*&resultRecordCount=50`
- **Update Frequency:** Monthly (30-day cache)
- **Data Format:** GeoJSON via ArcGIS REST API
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data
- **Notes:** Polygon layer (heavy on mobile). Includes area name, bylaw date, qualifier, description. Limited to 50 results.

#### Tree Canopy
- **Layer:** `treeCanopy`
- **Edge Function:** `api/tree-canopy.js`
- **Data Source:** Toronto ArcGIS Tree Canopy Data
- **Upstream URL:** `https://gis.toronto.ca/arcgis/rest/services/cot_geospatial13/FeatureServer/43/query?f=geojson&outSR=4326&where=1%3D1&outFields=*&resultRecordCount=50`
- **Update Frequency:** Quarterly (90-day cache)
- **Data Format:** GeoJSON via ArcGIS REST API
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data
- **Notes:** Polygon layer. Includes canopy type, tree species, cover percentage. Limited to 50 results.

#### Federal Ridings
- **Layer:** `federalRidings`
- **Edge Function:** `api/federal-ridings.js`
- **Data Source:** Elections Canada ESRI REST API
- **Upstream URL:** `https://maps-cartes.services.geo.ca/server_serveur/rest/services/ELECTIONS/FED_Elect2025_en/MapServer/0/query`
- **Update Frequency:** Monthly (30-day cache)
- **Data Format:** GeoJSON via ESRI REST API
- **Status:** ✅ Live
- **License/Attribution:** Elections Canada
- **Notes:** Filters to Greater Toronto Area bounding box. Returns riding name, ID, and province.

#### Traffic Signals
- **Layer:** `trafficSignals`
- **Edge Function:** `api/traffic-signals.js`
- **Data Source:** City of Toronto CKAN Traffic Signals
- **Upstream URL:** `https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/7d3ae06b-0217-4cc9-92ed-97adafca2f7b`
- **Update Frequency:** Daily (24-hour cache)
- **Data Format:** CSV → GeoJSON
- **Status:** ✅ Live
- **License/Attribution:** City of Toronto Open Data License
- **Notes:** Transforms CKAN CSV to GeoJSON. Includes signal ID, type, status, intersection.

#### Ontario Wildfires
- **Layer:** `ontarioWildfires`
- **Edge Function:** `api/ontario-wildfires.js`
- **Data Source:** Ontario Wildfire Data
- **Upstream URL:** (varies by endpoint)
- **Update Frequency:** Hourly
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** Government of Ontario
- **Notes:** Real-time wildfire information for Ontario.

#### Ontario 511 (Road Conditions)
- **Layer:** `ontario_roads`
- **Edge Function:** `api/ontario-511.js`
- **Data Source:** Ontario 511 Road Conditions
- **Upstream URL:** (varies by endpoint)
- **Update Frequency:** Real-time (5-minute cache)
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** Government of Ontario
- **Notes:** Road closures, conditions, construction events.

#### Ontario Floods (TRCA)
- **Layer:** `ontario_floods`
- **Edge Function:** `api/trca-floods.js` (or similar)
- **Data Source:** Toronto and Region Conservation Authority (TRCA)
- **Upstream URL:** (varies by endpoint)
- **Update Frequency:** Hourly
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** TRCA
- **Notes:** Flood warnings, water level data for Toronto region.

#### ECCC Weather Alerts
- **Layer:** `ontario_weather_alerts`
- **Edge Function:** `api/eccc-ontario-alerts.js`
- **Data Source:** Environment and Climate Change Canada Weather Alerts
- **Upstream URL:** (varies by endpoint)
- **Update Frequency:** Real-time (5-minute cache)
- **Data Format:** JSON / ATOM feed
- **Status:** ✅ Live
- **License/Attribution:** Government of Canada (Open Data)
- **Notes:** Weather warnings, watches, advisories for Ontario.

#### Ontario Spills
- **Layer:** `ontario_spills`
- **Edge Function:** `api/ontario-spills.js`
- **Data Source:** Ontario Spills Data
- **Upstream URL:** (varies by endpoint)
- **Update Frequency:** Daily
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** Government of Ontario
- **Notes:** Environmental spill reports and incidents.

#### Lake Ontario Level
- **Layer:** `lakeOntarioLevel`
- **Edge Function:** `api/lake-ontario-level.js`
- **Data Source:** Great Lakes Water Level Data (NOAA/USACE)
- **Upstream URL:** (varies by endpoint)
- **Update Frequency:** Daily
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** NOAA / US Army Corps of Engineers
- **Notes:** Water level measurements for Lake Ontario.

#### Childcare
- **Layer:** `childcare`
- **Edge Function:** `api/childcare.js`
- **Data Source:** Ontario Childcare Data
- **Upstream URL:** (varies by endpoint)
- **Update Frequency:** Monthly (30-day cache)
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** Government of Ontario
- **Notes:** Childcare centre locations and information.

#### AGCO Liquor Licences
- **Layer:** `agcoLicences`
- **Edge Function:** `api/agco-licences.js`
- **Data Source:** Alcohol and Gaming Commission of Ontario (AGCO)
- **Upstream URL:** (varies by endpoint)
- **Update Frequency:** Monthly (30-day cache)
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** AGCO
- **Notes:** Liquor licence locations and status.

#### Library Branches (TPL)
- **Layer:** `libraryBranches`
- **Edge Function:** `api/tpl-libraries.js`
- **Data Source:** Toronto Public Library
- **Upstream URL:** `https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/f5aa9b07-da35-45e6-b31f-d6790eb9bd9b/resource/0a48b601-9a07-4de6-ae73-b955527b3e70/download/tpl-branch-general-information-2023.json`
- **Update Frequency:** Weekly (7-day cache)
- **Data Format:** JSON
- **Status:** ✅ Live
- **License/Attribution:** Toronto Public Library / City of Toronto
- **Notes:** All TPL branches with hours, contact info, features. Has seed fallback.

---

### ⚠️ Partial / Static Data Sources

#### Toronto Fire Incidents
- **Layer:** `toronto_fire_incidents`
- **Edge Function:** `api/toronto-fire.js`
- **Data Source:** Toronto Fire Services CAD
- **Upstream URL:** N/A (no public API)
- **Update Frequency:** Intended real-time (5 min)
- **Data Format:** JSON
- **Status:** ⚠️ Partial (seed data only currently)
- **License/Attribution:** Toronto Fire Services
- **Notes:** Currently serving hardcoded seed data. Intended to be real-time via CAD feed, but no public API available. CORS-restricted endpoints.

#### Green P Parking
- **Layer:** `greenPParking`
- **Edge Function:** `api/green-p-parking.js`
- **Data Source:** City of Toronto Open Data
- **Upstream URL:** `https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/b66466c3-69c8-4825-9c8b-04b270069193/resource/8549d588-30b0-482e-b872-b21beefdda22/download/green-p-parking-2019.json`
- **Update Frequency:** Frozen (2019 snapshot)
- **Data Format:** JSON
- **Status:** ⚠️ Partial (static historical data)
- **License/Attribution:** City of Toronto Open Data License
- **Notes:** 2019 snapshot only. No live availability data. Includes lot name, address, capacity, rates.

#### Protest Events
- **Layer:** `protestEvents`
- **Edge Function:** `api/protest-events.js`
- **Data Source:** CivicTechTO Toronto Events Feed (primary)
- **Upstream URL:** `https://raw.githubusercontent.com/CivicTechTO/toronto-opendata-festivalsandevents-jsonld-proxy/main/docs/upcoming.jsonld`
- **Update Frequency:** Daily (24-hour cache)
- **Data Format:** JSON-LD
- **Status:** ⚠️ Partial (events feed, not protest-specific)
- **License/Attribution:** City of Toronto / CivicTechTO
- **Notes:** Primarily festivals/events feed. Includes rallies and civic events but not protest-specific data. Has seed fallback. GDELT API deprecated.

#### Court Facilities
- **Layer:** `courtFacilities`
- **Edge Function:** `api/court-facilities.js`
- **Data Source:** Ontario Court of Justice (verified addresses)
- **Upstream URL:** N/A (static data)
- **Update Frequency:** Static (courthouse locations rarely change)
- **Data Format:** JSON
- **Status:** ⚠️ Partial (static locations only)
- **License/Attribution:** Ontario Court of Justice
- **Notes:** Pre-geocoded courthouse locations. No live status or schedules. Addresses verified from official sources.

#### Urban Heat Island
- **Layer:** `urbanHeatIsland`
- **Edge Function:** `api/urban-heat.js`
- **Data Source:** Urban Heat Island Analysis (seed data)
- **Upstream URL:** N/A
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ⚠️ Partial (seed data only)
- **License/Attribution:** N/A
- **Notes:** Seed data representing downtown heat zones. Based on urban development density and heat vulnerability analysis. Not real-time data.

---

### ❌ Seed-Only Data Sources (No Live API)

#### Toronto 311 Stress
- **Layer:** `toronto_311_stress`
- **Edge Function:** `api/toronto-311.js`
- **Data Source:** City of Toronto 311 Service Requests
- **Upstream URL:** N/A (no public API)
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** City of Toronto
- **Notes:** DataStore not available for 311 datasets. Returns static seed data with ward stress scores and sample requests.

#### Toronto Development
- **Layer:** `toronto_development`
- **Edge Function:** `api/toronto-development.js`
- **Data Source:** City of Toronto Development Applications
- **Upstream URL:** N/A (seed data only)
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** City of Toronto
- **Notes:** Static seed data for development applications. No live API integration.

#### Toronto Water Level
- **Layer:** `toronto_water_level`
- **Edge Function:** `api/toronto-water-level.js`
- **Data Source:** Toronto Water Level Data
- **Upstream URL:** N/A (seed data only)
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** City of Toronto
- **Notes:** Static seed data only.

#### Toronto Air Traffic
- **Layer:** `toronto_air_traffic`
- **Edge Function:** `api/toronto-airtraffic.js`
- **Data Source:** Toronto Air Traffic Data
- **Upstream URL:** N/A (seed data only)
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** N/A
- **Notes:** Static seed data only.

#### Community Housing (Ontario)
- **Layer:** `communityHousing`
- **Edge Function:** `api/ontario-housing.js`
- **Data Source:** Ontario Housing Supply Progress
- **Upstream URL:** `https://data.ontario.ca/api/3/action/package_show?id=ontario-s-housing-supply-progress`
- **Update Frequency:** N/A (seed data only)
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** Government of Ontario
- **Notes:** Static seed data for GTA municipalities housing targets. No live data fetching.

#### Police Divisions
- **Layer:** `policeDivisions`
- **Edge Function:** N/A (static data)
- **Data Source:** Toronto Police Service Division Boundaries
- **Upstream URL:** N/A
- **Update Frequency:** Static
- **Data Format:** N/A
- **Status:** ❌ Seed-only
- **License/Attribution:** Toronto Police Service
- **Notes:** Static division boundaries. No live data.

#### MLS Investigations
- **Layer:** `mlsInvestigations`
- **Edge Function:** N/A
- **Data Source:** Toronto MLS Investigations
- **Upstream URL:** N/A
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** N/A
- **Notes:** Static seed data only.

#### Toronto Hydro Outages
- **Layer:** `torontoHydroOutages`
- **Edge Function:** `api/toronto-hydro-outages.js` and `api/toronto-hydro.js`
- **Data Source:** Toronto Hydro Outage Map
- **Upstream URL:** N/A (no public API)
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** Toronto Hydro
- **Notes:** **NO REAL DATA SOURCE AVAILABLE**. Toronto Hydro does not provide a public API for outage data. The outage map at `https://outagemap.torontohydro.com/` is client-side with no accessible API. Returns placeholder seed data for API compatibility only.

#### Green Roof Permits
- **Layer:** `greenRoofPermits`
- **Edge Function:** `api/green-roof-permits.js`
- **Data Source:** City of Toronto Green Roof Permits
- **Upstream URL:** N/A (seed data only)
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** City of Toronto
- **Notes:** Static seed data for green roof construction permits. No live API integration.

#### Flu Clinics
- **Layer:** `fluClinics`
- **Edge Function:** `api/flu-clinics.js`
- **Data Source:** Ontario Flu Clinics
- **Upstream URL:** N/A (no public API)
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** Ontario Public Health
- **Notes:** **NO REAL DATA SOURCE AVAILABLE**. Ontario has shut down flu clinic reporting APIs. Returns empty array outside flu season (October-March). 15 representative seed clinic locations for API compatibility.

#### Election Data
- **Layer:** `electionData`
- **Edge Function:** N/A
- **Data Source:** Election Data
- **Upstream URL:** N/A
- **Update Frequency:** N/A
- **Data Format:** JSON
- **Status:** ❌ Seed-only
- **License/Attribution:** N/A
- **Notes:** Static seed data only.

---

## Data Formats

- **GeoJSON:** Geographic data format for points, lines, polygons. Used by ArcGIS, CKAN, Elections Canada.
- **JSON:** Standard JavaScript Object Notation. Most common format.
- **CSV:** Comma-separated values. Used by schools data.
- **GBFS:** General Bikeshare Feed Specification. Standard for bike share systems.
- **Protobuf:** Protocol Buffers (binary). Used by TTC GTFS-RT for real-time vehicle positions.
- **JSON-LD:** JSON with Linked Data semantics. Used by CivicTechTO events feed.

## Cache Strategy

Most live data sources use **Upstash Redis** for edge caching:

- **Real-time (30s - 5 min):** TTC Vehicles, Bike Share, Road Construction, Ontario 511, Weather Alerts
- **Hourly (1h):** AQHI, Ontario Wildfires, Ontario Floods
- **Daily (12h - 24h):** DineSafe, EV Charging, Traffic Signals, Schools, Protest Events
- **Weekly (7d):** Cycling Network, Library Branches
- **Monthly (30d):** Neighbourhoods, Ravine Protection, Federal Ridings, Childcare, AGCO Licences
- **Quarterly (90d):** Tree Canopy

Cache headers include `stale-while-revalidate` for graceful degradation.

## Known Issues & Limitations

1. **Toronto Fire:** No public CAD API. Currently seed-only.
2. **Toronto Hydro:** No public outage API. Outage map is client-side only.
3. **Flu Clinics:** Ontario shut down public APIs. Returns empty outside flu season.
4. **Green P Parking:** 2019 snapshot only. No live availability.
5. **Protest Events:** Uses events feed, not protest-specific. GDELT API deprecated.
6. **311 Service Requests:** DataStore not available for open data integration.
7. **ArcGIS Results Limited:** Some layers (ravine protection, tree canopy) limited to 50 results for performance.

## License Information

Most data sources are provided under:

- **City of Toronto Open Data License:** https://www.toronto.ca/city-government/data-researchmaps/open-data/open-data-licence/
- **Government of Canada Open Data Licence:** https://open.canada.ca/en/open-government-licence-canada
- **Government of Ontario Open Data Licence:** https://www.ontario.ca/page/open-government-licence-ontario
- **GTFS:** Open data standard for transit data
- **GBFS:** Open data standard for bike share data

Users should review individual data source licenses for specific terms of use.

## Data Quality Notes

- **Geocoding:** Most seed data uses pre-geocoded coordinates. Live data sources include coordinates in API responses.
- **Data Freshness:** Update frequencies noted above are cache TTLs. Actual upstream data may update less frequently.
- **Rate Limits:** Some APIs (NREL, Elections Canada) may have rate limits. Cache strategy helps minimize requests.
- **Fallback Behavior:** Most APIs return seed or cached data on failure to ensure application stability.