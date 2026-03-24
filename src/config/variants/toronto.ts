// Toronto/GTA city intelligence variant - toronto.worldmonitor.app
import type { PanelConfig, MapLayers } from "@/types";
import type { VariantConfig } from "./base";

// Re-export base config
export * from "./base";

// Toronto-specific RSS feeds
import type { Feed } from "@/types";
import { rssProxyUrl } from "@/utils";

const rss = rssProxyUrl;

// Toronto-focused feeds configuration
export const TORONTO_FEEDS: Record<string, Feed[]> = {
  canadianNews: [
    {
      name: "CBC News",
      url: rss("https://rss.cbc.ca/lineup/canada.xml"),
      tier: 1,
      region: "CA",
    },
    {
      name: "CBC Toronto",
      url: rss("https://rss.cbc.ca/cmlink/rss-canada-toronto"),
      tier: 1,
      region: "CA",
    },
    {
      name: "CTV News",
      url: rss(
        "https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009",
      ),
      tier: 1,
      region: "CA",
    },
    {
      name: "Global News",
      url: rss("https://globalnews.ca/feed/"),
      tier: 1,
      region: "CA",
    },
  ],
  torontoNews: [
    {
      name: "CityNews Toronto",
      url: rss("https://toronto.citynews.ca/feed"),
      tier: 2,
      region: "CA",
    },
    {
      name: "Ontario News",
      url: rss("https://news.ontario.ca/en/rss/newsreleases"),
      tier: 2,
      region: "CA",
    },
  ],
  financial: [
    {
      name: "Bank of Canada",
      url: rss("https://www.bankofcanada.ca/news/press-releases/rss/"),
      tier: 2,
      region: "CA",
    },
  ],
  environment: [
    { name: "TRCA", url: rss("https://trca.ca/feed/"), tier: 3, region: "CA" },
    {
      name: "Environment Canada Weather Alerts",
      url: "/api/eccc-ontario-alerts",
      tier: 1,
      region: "CA",
      type: "eccc-alerts",
    },
  ],
};

// Panel configuration for Toronto city intelligence
export const DEFAULT_PANELS: Record<string, PanelConfig> = {
  map: { name: "Toronto Intelligence Map", enabled: true, priority: 1 },
  "live-news": { name: "Toronto Headlines", enabled: true, priority: 1 },
  "toronto-fire": { name: "Fire CAD", enabled: true, priority: 1 },
  "ontario-roads": { name: "Ontario 511", enabled: true, priority: 1 },
  "eccc-alerts": { name: "Weather Alerts", enabled: true, priority: 1 },
  "shelter-gauge": { name: "Shelter System", enabled: true, priority: 1 },
  "boc-ticker": { name: "BoC Rates", enabled: true, priority: 1 },
  "building-permits": { name: "Building Permits", enabled: true, priority: 1 },
  dinesafe: { name: "DineSafe Closures", enabled: true, priority: 1 },
  "trca-floods": { name: "TRCA Floods", enabled: true, priority: 1 },
  "housing-targets": { name: "Housing Targets", enabled: false, priority: 2 },
  "statcan-toronto": { name: "Statistics Canada", enabled: true, priority: 1 },
  "toronto-311": { name: "311 Service Requests", enabled: true, priority: 1 },
  "ttc-health": { name: "TTC Health", enabled: true, priority: 1 },
  // New Widgets 11-20
  "toronto-crime": { name: "Crime Delta", enabled: true, priority: 1 },
  "parks-recreation": { name: "Parks & Recreation", enabled: true, priority: 1 },
  "toronto-development": {
    name: "Development Pipeline",
    enabled: true,
    priority: 1,
  },
  "ontario-electricity": {
    name: "Electricity Price",
    enabled: true,
    priority: 1,
  },
  "toronto-water-level": { name: "Water Level", enabled: false, priority: 2 },
  "community-housing": { name: "Community Housing", enabled: true, priority: 1 },
  schools: { name: "Toronto Schools", enabled: true, priority: 1 },
  "ev-charging": { name: "EV Charging", enabled: true, priority: 1 },
  "cycling-network": { name: "Cycling Network", enabled: true, priority: 1 },
  "ravine-protection": { name: "Ravine Protection", enabled: false, priority: 2 },
  "crime-incidents": { name: "Crime Incidents", enabled: true, priority: 1 },
  "eccc-aqhi": { name: "Air Quality (AQHI)", enabled: true, priority: 1 },
  "tree-canopy": { name: "Tree Canopy", enabled: false, priority: 2 },
  "lake-ontario-level": { name: "Lake Ontario Level", enabled: false, priority: 2 },
  "bike-share": { name: "Bike Share", enabled: true, priority: 1 },
  // N20: Urban Heat Island - OFF by default (P3)
  "urban-heat": { name: "Urban Heat Island", enabled: false, priority: 3 },
  // N4: Court Facilities - OFF by default (P4)
  "court-facilities": { name: "Court Facilities", enabled: false, priority: 2 },
  // N6: TTC Real-Time - ON by default (P1)
  "ttc-realtime": { name: "TTC Real-Time", enabled: true, priority: 1 },
  // N11: Road Construction - ON by default (P2)
  "road-construction": { name: "Road Construction", enabled: true, priority: 1 },
  // N15: Ontario Wildfires - ON by default (P2)
  "ontario-wildfires": { name: "Ontario Wildfires", enabled: true, priority: 1 },
  // N16: Flooding Composite - OFF by default (P2)
  "flooding-composite": { name: "Flooding Composite", enabled: false, priority: 2 },
  "childcare": { name: "Childcare Centres", enabled: false, priority: 2 },
  "flu-clinics": { name: "Flu Clinics", enabled: false, priority: 3 },
  "agco-licences": { name: "Liquor Licences", enabled: false, priority: 3 },
  "green-roof-permits": { name: "Green Roof Permits", enabled: false, priority: 3 },
  "library-branches": { name: "Library Branches", enabled: true, priority: 1 },
  "election-data": { name: "Election Data", enabled: false, priority: 2 },
  "ttc-vehicles": { name: "TTC Vehicles", enabled: true, priority: 1 },
  "protest-events": { name: "Protest Events", enabled: false, priority: 2 },
  "green-p-parking": { name: "Green P Parking", enabled: false, priority: 2 },
  "police-divisions": { name: "Police Divisions", enabled: false, priority: 2 },
};

// Map layers for Toronto city view
export const DEFAULT_MAP_LAYERS: MapLayers = {
  gpsJamming: false,
  satellites: false,

  // Disable global geopolitical layers
  conflicts: false,
  bases: false,
  cables: false,
  pipelines: false,
  hotspots: false,
  ais: false,
  nuclear: false,
  irradiators: false,
  sanctions: false,
  weather: true,
  economic: false,
  waterways: false,
  outages: true,
  cyberThreats: false,
  datacenters: false,
  protests: false,
  flights: true,
  military: false,
  natural: true,
  spaceports: false,
  minerals: false,
  fires: false,
  ucdpEvents: false,
  displacement: false,
  climate: false,

  // Tech layers (disabled in Toronto variant)
  startupHubs: false,
  cloudRegions: false,
  accelerators: false,
  techHQs: false,
  techEvents: false,

  // Finance layers
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  commodityHubs: false,
  gulfInvestments: false,

  // Happy variant layers
  positiveEvents: false,
  kindness: false,
  happiness: false,
  speciesRecovery: false,
  renewableInstallations: false,

  // Trade routes
  tradeRoutes: false,

  // Iran attacks
  iranAttacks: false,

  // CII choropleth
  ciiChoropleth: false,

  // Day/Night overlay
  dayNight: false,

  // Commodity variant layers
  miningSites: false,
  processingPlants: false,
  commodityPorts: false,
  webcams: false,
  weatherRadar: false,

  // Toronto-specific layers
  // Desktop defaults: High-value general interest + real-time + reference layers ON
  toronto_fire_incidents: true, // Real-time: Toronto Fire
  toronto_dinesafe: true, // High-value: DineSafe
  toronto_neighbourhoods: false, // OFF: Urban planning (niche)
  toronto_311_stress: false, // OFF: Niche
  toronto_development: false, // OFF: Urban planning (niche)
  toronto_water_level: false,
  toronto_earthquakes: false,
  ontario_spills: false,
  toronto_air_traffic: false,
  ontario_roads: false, // Not in requirements, keep OFF
  ontario_weather_alerts: false, // Not in requirements, keep OFF
  ontario_floods: false, // Not in requirements, keep OFF
  schools: true, // High-value: Schools
  communityHousing: true, // High-value: Community Housing
  greenPParking: true, // High-value: Green P Parking
  parksRecreation: true, // High-value: Parks
  evCharging: true, // High-value: EV Charging
  cyclingNetwork: true, // Reference: Cycling Network
  ravineProtection: false, // OFF: Niche (polygon layer, heavy)
  crimeIncidents: true, // High-value: Crime Incidents
  policeDivisions: false,
  ecccAqhi: true, // Real-time: AQHI
  treeCanopy: false, // OFF: Niche
  lakeOntarioLevel: false,
  bikeShare: true, // High-value: Bike Share
  protestEvents: false, // OFF: Seed-only
  federalRidings: false, // OFF: Specialized
  mlsInvestigations: false, // OFF: Specialized
  torontoHydroOutages: false, // OFF: Seed-only
  trafficSignals: false, // OFF: Specialized
  // N4: Court Facilities - OFF by default
  courtFacilities: false,
  // N6: TTC Real-Time - ON by default (Real-time)
  ttcRealtime: true,
  // N11: Road Construction - ON by default (High-value)
  roadConstruction: true,
  // N15: Ontario Wildfires - OFF by default (not in requirements)
  ontarioWildfires: false,
  // N16: Flooding Composite - OFF by default
  floodingComposite: false,
  childcare: false,
  fluClinics: false, // OFF: Seed-only
  agcoLicences: false,
  greenRoofPermits: false, // OFF: Seed-only
  libraryBranches: true, // Reference: Libraries
  electionData: false,
  urbanHeatIsland: false, // OFF: Niche
  ttcVehicles: true, // Real-time: TTC Vehicles
};

// Mobile defaults for Toronto variant
export const MOBILE_DEFAULT_MAP_LAYERS: MapLayers = {
  gpsJamming: false,
  satellites: false,

  // Disable most global layers for mobile
  conflicts: false,
  bases: false,
  cables: false,
  pipelines: false,
  hotspots: false,
  ais: false,
  nuclear: false,
  irradiators: false,
  sanctions: false,
  weather: true,
  economic: false,
  waterways: false,
  outages: true,
  cyberThreats: false,
  datacenters: false,
  protests: false,
  flights: false,
  military: false,
  natural: true,
  spaceports: false,
  minerals: false,
  fires: false,
  ucdpEvents: false,
  displacement: false,
  climate: false,

  // Tech layers
  startupHubs: false,
  cloudRegions: false,
  accelerators: false,
  techHQs: false,
  techEvents: false,

  // Finance layers
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  commodityHubs: false,
  gulfInvestments: false,

  // Happy variant layers
  positiveEvents: false,
  kindness: false,
  happiness: false,
  speciesRecovery: false,
  renewableInstallations: false,

  // Trade routes
  tradeRoutes: false,

  // Iran attacks
  iranAttacks: false,

  // CII choropleth
  ciiChoropleth: false,

  // Day/Night overlay
  dayNight: false,

  // Commodity variant layers
  miningSites: false,
  processingPlants: false,
  commodityPorts: false,
  webcams: false,
  weatherRadar: false,

  // Toronto-specific layers (limited on mobile)
  // Mobile defaults: Smaller subset focused on essential real-time data
  toronto_fire_incidents: false, // OFF: Not in mobile requirements
  toronto_dinesafe: true, // ON: High-value
  toronto_neighbourhoods: false,
  toronto_311_stress: false,
  toronto_development: false,
  toronto_water_level: false,
  toronto_earthquakes: false,
  ontario_spills: false,
  toronto_air_traffic: false,
  ontario_roads: false,
  ontario_weather_alerts: false,
  ontario_floods: false,
  schools: false,
  communityHousing: false,
  parksRecreation: false,
  evCharging: false,
  cyclingNetwork: false,
  ravineProtection: false,
  crimeIncidents: true, // ON: High-value
  policeDivisions: false,
  ecccAqhi: false,
  treeCanopy: false,
  lakeOntarioLevel: false,
  bikeShare: true, // ON: High-value
  protestEvents: false, // OFF: Seed-only
  electionData: false,
  federalRidings: false,
  mlsInvestigations: false,
  torontoHydroOutages: false, // OFF: Seed-only
  trafficSignals: false,
  // N4: Court Facilities - OFF by default
  courtFacilities: false,
  // N6: TTC Real-Time - ON by default (Real-time)
  ttcRealtime: true,
  // N11: Road Construction - ON by default (High-value)
  roadConstruction: true,
  // N15: Ontario Wildfires - OFF by default (not in mobile requirements)
  ontarioWildfires: false,
  // N16: Flooding Composite - OFF by default
  floodingComposite: false,
  childcare: false,
  fluClinics: false,
  agcoLicences: false,
  greenRoofPermits: false,
  libraryBranches: false,
  ttcVehicles: true, // ON: Real-time
  greenPParking: true, // ON: High-value (added for mobile)
};

export const VARIANT_CONFIG: VariantConfig = {
  name: "toronto",
  description:
    "Toronto & GTA city intelligence — emergency, development, social, transit",
  panels: DEFAULT_PANELS,
  mapLayers: DEFAULT_MAP_LAYERS,
  mobileMapLayers: MOBILE_DEFAULT_MAP_LAYERS,
};

// Additional RSS feeds to merge with global feed set
export const ADDITIONAL_FEEDS: Feed[] = [
  {
    name: "CBC Canada News",
    url: rss("https://rss.cbc.ca/lineup/canada.xml"),
    tier: 1,
    region: "CA",
  },
  {
    name: "CBC Toronto News",
    url: rss("https://rss.cbc.ca/cmlink/rss-canada-toronto"),
    tier: 1,
    region: "CA",
  },
  {
    name: "CTV Canada News",
    url: rss(
      "https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009",
    ),
    tier: 1,
    region: "CA",
  },
  {
    name: "Global News Canada",
    url: rss("https://globalnews.ca/feed/"),
    tier: 1,
    region: "CA",
  },
  {
    name: "Toronto CityNews",
    url: rss("https://toronto.citynews.ca/feed"),
    tier: 2,
    region: "CA",
  },
  {
    name: "Ontario Newsroom",
    url: rss("https://news.ontario.ca/en/rss/newsreleases"),
    tier: 2,
    region: "CA",
  },
  {
    name: "Bank of Canada Press Releases",
    url: rss("https://www.bankofcanada.ca/news/press-releases/rss/"),
    tier: 2,
    region: "CA",
  },
  {
    name: "TRCA Updates",
    url: rss("https://trca.ca/feed/"),
    tier: 3,
    region: "CA",
  },
  {
    name: "Environment Canada Weather Alerts",
    url: "/api/eccc-ontario-alerts",
    tier: 1,
    region: "CA",
    type: "eccc-alerts",
  },
];

// Initial map view for Toronto variant
export const INITIAL_VIEW = {
  longitude: -79.3832,
  latitude: 43.6532,
  zoom: 10,
  pitch: 0,
} as const;
