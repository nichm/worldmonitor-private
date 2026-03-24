import type { MapLayers } from "@/types";
// boundary-ignore: isDesktopRuntime is a pure env probe with no service dependencies
import { isDesktopRuntime } from "@/services/runtime";

export type MapRenderer = "flat" | "globe";
export type MapVariant =
  | "full"
  | "tech"
  | "finance"
  | "happy"
  | "commodity"
  | "toronto";

const _desktop = isDesktopRuntime();

export interface LayerDefinition {
  key: keyof MapLayers;
  icon: string;
  i18nSuffix: string;
  fallbackLabel: string;
  renderers: MapRenderer[];
  premium?: "locked" | "enhanced";
}

const def = (
  key: keyof MapLayers,
  icon: string,
  i18nSuffix: string,
  fallbackLabel: string,
  renderers: MapRenderer[] = ["flat", "globe"],
  premium?: "locked" | "enhanced",
): LayerDefinition => ({
  key,
  icon,
  i18nSuffix,
  fallbackLabel,
  renderers,
  ...(premium && { premium }),
});

export const LAYER_REGISTRY: Record<keyof MapLayers, LayerDefinition> = {
  iranAttacks: def(
    "iranAttacks",
    "&#127919;",
    "iranAttacks",
    "Iran Attacks",
    ["flat", "globe"],
    _desktop ? "locked" : undefined,
  ),
  hotspots: def("hotspots", "&#127919;", "intelHotspots", "Intel Hotspots"),
  conflicts: def("conflicts", "&#9876;", "conflictZones", "Conflict Zones"),

  bases: def("bases", "&#127963;", "militaryBases", "Military Bases"),
  nuclear: def("nuclear", "&#9762;", "nuclearSites", "Nuclear Sites"),
  irradiators: def(
    "irradiators",
    "&#9888;",
    "gammaIrradiators",
    "Gamma Irradiators",
  ),
  radiationWatch: def(
    "radiationWatch",
    "&#9762;",
    "radiationWatch",
    "Radiation Watch",
  ),
  spaceports: def("spaceports", "&#128640;", "spaceports", "Spaceports"),
  satellites: def(
    "satellites",
    "&#128752;",
    "satellites",
    "Orbital Surveillance",
    ["flat", "globe"],
  ),

  cables: def("cables", "&#128268;", "underseaCables", "Undersea Cables"),
  pipelines: def("pipelines", "&#128738;", "pipelines", "Pipelines"),
  datacenters: def(
    "datacenters",
    "&#128421;",
    "aiDataCenters",
    "AI Data Centers",
  ),
  military: def("military", "&#9992;", "militaryActivity", "Military Activity"),
  ais: def("ais", "&#128674;", "shipTraffic", "Ship Traffic"),
  tradeRoutes: def("tradeRoutes", "&#9875;", "tradeRoutes", "Trade Routes"),
  flights: def("flights", "&#9992;", "flightDelays", "Aviation"),
  protests: def("protests", "&#128226;", "protests", "Protests"),
  ucdpEvents: def(
    "ucdpEvents",
    "&#9876;",
    "ucdpEvents",
    "Armed Conflict Events",
  ),
  displacement: def(
    "displacement",
    "&#128101;",
    "displacementFlows",
    "Displacement Flows",
  ),
  climate: def("climate", "&#127787;", "climateAnomalies", "Climate Anomalies"),
  weather: def("weather", "&#9928;", "weatherAlerts", "Weather Alerts"),
  outages: def("outages", "&#128225;", "internetOutages", "Internet Outages"),
  cyberThreats: def(
    "cyberThreats",
    "&#128737;",
    "cyberThreats",
    "Cyber Threats",
  ),
  natural: def("natural", "&#127755;", "naturalEvents", "Natural Events"),
  fires: def("fires", "&#128293;", "fires", "Fires"),
  waterways: def(
    "waterways",
    "&#9875;",
    "strategicWaterways",
    "Strategic Waterways",
  ),
  economic: def("economic", "&#128176;", "economicCenters", "Economic Centers"),
  minerals: def(
    "minerals",
    "&#128142;",
    "criticalMinerals",
    "Critical Minerals",
  ),
  gpsJamming: def(
    "gpsJamming",
    "&#128225;",
    "gpsJamming",
    "GPS Jamming",
    ["flat", "globe"],
    _desktop ? "locked" : undefined,
  ),
  ciiChoropleth: def(
    "ciiChoropleth",
    "&#127758;",
    "ciiChoropleth",
    "CII Instability",
    ["flat"],
    _desktop ? "enhanced" : undefined,
  ),
  dayNight: def("dayNight", "&#127763;", "dayNight", "Day/Night", ["flat"]),
  sanctions: def("sanctions", "&#128683;", "sanctions", "Sanctions", []),
  startupHubs: def("startupHubs", "&#128640;", "startupHubs", "Startup Hubs"),
  techHQs: def("techHQs", "&#127970;", "techHQs", "Tech HQs"),
  accelerators: def("accelerators", "&#9889;", "accelerators", "Accelerators"),
  cloudRegions: def("cloudRegions", "&#9729;", "cloudRegions", "Cloud Regions"),
  techEvents: def("techEvents", "&#128197;", "techEvents", "Tech Events"),
  stockExchanges: def(
    "stockExchanges",
    "&#127963;",
    "stockExchanges",
    "Stock Exchanges",
  ),
  financialCenters: def(
    "financialCenters",
    "&#128176;",
    "financialCenters",
    "Financial Centers",
  ),
  centralBanks: def(
    "centralBanks",
    "&#127974;",
    "centralBanks",
    "Central Banks",
  ),
  commodityHubs: def(
    "commodityHubs",
    "&#128230;",
    "commodityHubs",
    "Commodity Hubs",
  ),
  gulfInvestments: def(
    "gulfInvestments",
    "&#127760;",
    "gulfInvestments",
    "GCC Investments",
  ),
  positiveEvents: def(
    "positiveEvents",
    "&#127775;",
    "positiveEvents",
    "Positive Events",
  ),
  kindness: def("kindness", "&#128154;", "kindness", "Acts of Kindness"),
  happiness: def("happiness", "&#128522;", "happiness", "World Happiness"),
  speciesRecovery: def(
    "speciesRecovery",
    "&#128062;",
    "speciesRecovery",
    "Species Recovery",
  ),
  renewableInstallations: def(
    "renewableInstallations",
    "&#9889;",
    "renewableInstallations",
    "Clean Energy",
  ),
  miningSites: def("miningSites", "&#128301;", "miningSites", "Mining Sites"),
  processingPlants: def(
    "processingPlants",
    "&#127981;",
    "processingPlants",
    "Processing Plants",
  ),
  commodityPorts: def(
    "commodityPorts",
    "&#9973;",
    "commodityPorts",
    "Commodity Ports",
  ),
  webcams: def("webcams", "&#128247;", "webcams", "Live Webcams"),
  weatherRadar: def(
    "weatherRadar",
    "&#127783;",
    "weatherRadar",
    "Weather Radar",
    ["flat"],
  ),
  // Toronto variant layers
  toronto_fire_incidents: def(
    "toronto_fire_incidents",
    "&#128293;",
    "torontoFireIncidents",
    "Fire Incidents",
  ),
  toronto_dinesafe: def(
    "toronto_dinesafe",
    "&#127869;",
    "torontoDinesafe",
    "DineSafe Closures",
  ),
  toronto_neighbourhoods: def(
    "toronto_neighbourhoods",
    "&#127963;",
    "torontoNeighbourhoods",
    "Neighbourhood Risk",
  ),
  toronto_311_stress: def(
    "toronto_311_stress",
    "&#128262;",
    "toronto311Stress",
    "311 Service Stress",
  ),
  toronto_development: def(
    "toronto_development",
    "&#127979;",
    "torontoDevelopment",
    "Development Pipeline",
  ),
  toronto_water_level: def(
    "toronto_water_level",
    "&#127755;",
    "torontoWaterLevel",
    "Lake Ontario Surge",
  ),
  toronto_earthquakes: def(
    "toronto_earthquakes",
    "&#128009;",
    "torontoEarthquakes",
    "Earthquakes",
  ),
  ontario_spills: def(
    "ontario_spills",
    "&#9888;",
    "ontarioSpills",
    "Hazardous Spills",
  ),
  toronto_air_traffic: def(
    "toronto_air_traffic",
    "&#9992;",
    "torontoAirTraffic",
    "Air Traffic",
  ),
  ontario_roads: def(
    "ontario_roads",
    "&#128736;",
    "ontarioRoads",
    "Highway Incidents",
  ),
  ontario_weather_alerts: def(
    "ontario_weather_alerts",
    "&#9928;",
    "ontarioWeatherAlerts",
    "Weather Alerts",
  ),
  ontario_floods: def(
    "ontario_floods",
    "&#127755;",
    "ontarioFloods",
    "TRCA Flood Watch",
  ),
  parksRecreation: def(
    "parksRecreation",
    "&#127793;",
    "parksRecreation",
    "Parks & Recreation",
  ),
  greenPParking: def(
    "greenPParking",
    "&#128663;",
    "greenPParking",
    "Green P Parking ⚠️ 2019",
  ),
  communityHousing: def(
    "communityHousing",
    "&#127968;",
    "communityHousing",
    "Community Housing",
  ),
  schools: def(
    "schools",
    "&#127979;",
    "schools",
    "Schools",
  ),
  evCharging: def(
    "evCharging",
    "&#9889;",
    "evCharging",
    "EV Charging",
  ),
  cyclingNetwork: def(
    "cyclingNetwork",
    "&#128692;",
    "cyclingNetwork",
    "Cycling Network",
  ),
  ravineProtection: def(
    "ravineProtection",
    "&#127795;",
    "ravineProtection",
    "Ravine Protection",
  ),
  crimeIncidents: def(
    "crimeIncidents",
    "&#128373;",
    "crimeIncidents",
    "Crime Incidents",
  ),
  policeDivisions: def(
    "policeDivisions",
    "&#128110;",
    "policeDivisions",
    "Police Divisions",
  ),
  childcare: def(
    "childcare",
    "&#128118;",
    "childcare",
    "Childcare Centres",
  ),
  fluClinics: def(
    "fluClinics",
    "&#129657;",
    "fluClinics",
    "Flu Clinics",
  ),
  agcoLicences: def(
    "agcoLicences",
    "&#127866;",
    "agcoLicences",
    "Liquor Licences",
  ),
  greenRoofPermits: def(
    "greenRoofPermits",
    "&#127807;",
    "greenRoofPermits",
    "Green Roof Permits",
  ),
  libraryBranches: def(
    "libraryBranches",
    "&#128218;",
    "libraryBranches",
    "Library Branches",
  ),
  treeCanopy: def(
    "treeCanopy",
    "&#127794;",
    "treeCanopy",
    "Tree Canopy",
  ),
  lakeOntarioLevel: def(
    "lakeOntarioLevel",
    "&#127754;",
    "lakeOntarioLevel",
    "Lake Ontario Level",
  ),
  bikeShare: def(
    "bikeShare",
    "&#128652;",
    "bikeShare",
    "Bike Share",
  ),
  protestEvents: def(
    "protestEvents",
    "&#128226;",
    "protestEvents",
    "Protest Events",
  ),
  courtFacilities: def(
    "courtFacilities",
    "&#9878;",
    "courtFacilities",
    "Court Facilities",
  ),
  roadConstruction: def(
    "roadConstruction",
    "&#128736;",
    "roadConstruction",
    "Road Construction",
  ),
  ontarioWildfires: def(
    "ontarioWildfires",
    "&#128293;",
    "ontarioWildfires",
    "Ontario Wildfires",
  ),
  floodingComposite: def(
    "floodingComposite",
    "&#127755;",
    "floodingComposite",
    "Flood Zones",
  ),
  urbanHeatIsland: def(
    "urbanHeatIsland",
    "&#127774;",
    "urbanHeatIsland",
    "Urban Heat Island",
    ["flat"],
  ),
  federalRidings: def(
    "federalRidings",
    "&#129497;",
    "federalRidings",
    "Federal Ridings",
    ["flat"],
  ),
  electionData: def(
    "electionData",
    "&#129497;",
    "electionData",
    "Election Polling Stations",
  ),
  mlsInvestigations: def(
    "mlsInvestigations",
    "&#128373;",
    "mlsInvestigations",
    "ML&S Investigations",
    ["flat"],
  ),
  neighbourhoods: def(
    "neighbourhoods",
    "&#127968;",
    "neighbourhoods",
    "Neighbourhoods",
    ["flat"],
  ),
  wardBoundaries: def(
    "wardBoundaries",
    "&#129497;",
    "wardBoundaries",
    "Ward Boundaries",
    ["flat"],
  ),
  torontoHydroOutages: def(
    "torontoHydroOutages",
    "&#9889;",
    "torontoHydroOutages",
    "Power Outages",
    ["flat"],
  ),
  trafficSignals: def(
    "trafficSignals",
    "&#128677;",
    "trafficSignals",
    "Traffic Signals",
    ["flat"],
  ),
  ttcVehicles: def(
    "ttcVehicles",
    "&#128673;",
    "ttcVehicles",
    "TTC Vehicles",
  ),
};

const VARIANT_LAYER_ORDER: Record<MapVariant, Array<keyof MapLayers>> = {
  full: [
    "iranAttacks",
    "hotspots",
    "conflicts",
    "bases",
    "nuclear",
    "irradiators",
    "radiationWatch",
    "spaceports",
    "cables",
    "pipelines",
    "datacenters",
    "military",
    "ais",
    "tradeRoutes",
    "flights",
    "protests",
    "ucdpEvents",
    "displacement",
    "climate",
    "weather",
    "outages",
    "cyberThreats",
    "natural",
    "fires",
    "waterways",
    "economic",
    "minerals",
    "gpsJamming",
    "satellites",
    "ciiChoropleth",
    "dayNight",
    "webcams",
    "weatherRadar",
  ],
  tech: [
    "startupHubs",
    "techHQs",
    "accelerators",
    "cloudRegions",
    "datacenters",
    "cables",
    "outages",
    "cyberThreats",
    "techEvents",
    "natural",
    "fires",
    "dayNight",
    "weatherRadar",
  ],
  finance: [
    "stockExchanges",
    "financialCenters",
    "centralBanks",
    "commodityHubs",
    "gulfInvestments",
    "tradeRoutes",
    "cables",
    "pipelines",
    "outages",
    "weather",
    "economic",
    "waterways",
    "natural",
    "cyberThreats",
    "dayNight",
    "weatherRadar",
  ],
  happy: [
    "positiveEvents",
    "kindness",
    "happiness",
    "speciesRecovery",
    "renewableInstallations",
  ],
  commodity: [
    "miningSites",
    "processingPlants",
    "commodityPorts",
    "commodityHubs",
    "minerals",
    "pipelines",
    "waterways",
    "tradeRoutes",
    "ais",
    "economic",
    "fires",
    "climate",
    "natural",
    "weather",
    "outages",
    "dayNight",
    "weatherRadar",
  ],
  toronto: [
    "toronto_fire_incidents",
    "toronto_dinesafe",
    "toronto_neighbourhoods",
    "toronto_311_stress",
    "toronto_development",
    "toronto_water_level",
    "toronto_earthquakes",
    "ontario_spills",
    "toronto_air_traffic",
    "ontario_roads",
    "ontario_weather_alerts",
    "ontario_floods",
    "greenPParking",
    "parksRecreation",
    "communityHousing",
    "schools",
    "evCharging",
    "cyclingNetwork",
    "ravineProtection",
    "crimeIncidents",
    "policeDivisions",
    "childcare",
    "fluClinics",
    "agcoLicences",
    "greenRoofPermits",
    "libraryBranches",
    "ecccAqhi",
    "treeCanopy",
    "lakeOntarioLevel",
    "bikeShare",
    "protestEvents",
    "urbanHeat",
    "electionData",
    "courtFacilities",
    "roadConstruction",
    "ontarioWildfires",
    "floodingComposite",
  ],
};

const SVG_ONLY_LAYERS: Partial<Record<MapVariant, Array<keyof MapLayers>>> = {
  full: ["sanctions"],
  finance: ["sanctions"],
  commodity: ["sanctions"],
  toronto: [],
};

const I18N_PREFIX = "components.deckgl.layers.";

export function getLayersForVariant(
  variant: MapVariant,
  renderer: MapRenderer,
): LayerDefinition[] {
  const keys = VARIANT_LAYER_ORDER[variant] ?? VARIANT_LAYER_ORDER.full;
  return keys
    .map((k) => LAYER_REGISTRY[k])
    .filter((d) => d.renderers.includes(renderer));
}

export function getAllowedLayerKeys(variant: MapVariant): Set<keyof MapLayers> {
  const keys = new Set(
    VARIANT_LAYER_ORDER[variant] ?? VARIANT_LAYER_ORDER.full,
  );
  for (const k of SVG_ONLY_LAYERS[variant] ?? []) keys.add(k);
  return keys;
}

export function sanitizeLayersForVariant(
  layers: MapLayers,
  variant: MapVariant,
): MapLayers {
  const allowed = getAllowedLayerKeys(variant);
  const sanitized = { ...layers };
  for (const key of Object.keys(sanitized) as Array<keyof MapLayers>) {
    if (!allowed.has(key)) sanitized[key] = false;
  }
  return sanitized;
}

export const LAYER_SYNONYMS: Record<string, Array<keyof MapLayers>> = {
  aviation: ["flights"],
  flight: ["flights"],
  airplane: ["flights"],
  plane: ["flights"],
  notam: ["flights"],
  ship: ["ais", "tradeRoutes"],
  vessel: ["ais"],
  maritime: ["ais", "waterways", "tradeRoutes"],
  sea: ["ais", "waterways", "cables"],
  ocean: ["cables", "waterways"],
  war: ["conflicts", "ucdpEvents", "military"],
  battle: ["conflicts", "ucdpEvents"],
  army: ["military", "bases"],
  navy: ["military", "ais"],
  missile: ["iranAttacks", "military"],
  nuke: ["nuclear"],
  radiation: ["radiationWatch", "nuclear", "irradiators"],
  radnet: ["radiationWatch"],
  safecast: ["radiationWatch"],
  anomaly: ["radiationWatch", "climate"],
  space: ["spaceports", "satellites"],
  orbit: ["satellites"],
  internet: ["outages", "cables", "cyberThreats"],
  cyber: ["cyberThreats", "outages"],
  hack: ["cyberThreats"],
  earthquake: ["natural"],
  volcano: ["natural"],
  tsunami: ["natural"],
  storm: ["weather", "natural"],
  hurricane: ["weather", "natural"],
  typhoon: ["weather", "natural"],
  cyclone: ["weather", "natural"],
  flood: ["weather", "natural"],
  wildfire: ["fires"],
  forest: ["fires"],
  refugee: ["displacement"],
  migration: ["displacement"],
  riot: ["protests"],
  demonstration: ["protests"],
  oil: ["pipelines", "commodityHubs"],
  gas: ["pipelines"],
  energy: ["pipelines", "renewableInstallations"],
  solar: ["renewableInstallations"],
  wind: ["renewableInstallations"],
  green: ["renewableInstallations", "speciesRecovery"],
  money: ["economic", "financialCenters", "stockExchanges"],
  bank: ["centralBanks", "financialCenters"],
  stock: ["stockExchanges"],
  trade: ["tradeRoutes", "waterways"],
  cloud: ["cloudRegions", "datacenters"],
  ai: ["datacenters"],
  startup: ["startupHubs", "accelerators"],
  tech: ["techHQs", "techEvents", "startupHubs", "cloudRegions", "datacenters"],
  gps: ["gpsJamming"],
  jamming: ["gpsJamming"],
  mineral: ["minerals", "miningSites"],
  mining: ["miningSites"],
  port: ["commodityPorts"],
  happy: ["happiness", "kindness", "positiveEvents"],
  good: ["positiveEvents", "kindness"],
  animal: ["speciesRecovery"],
  wildlife: ["speciesRecovery"],
  gulf: ["gulfInvestments"],
  gcc: ["gulfInvestments"],
  sanction: ["sanctions"],
  night: ["dayNight"],
  sun: ["dayNight"],
  webcam: ["webcams"],
  camera: ["webcams"],
  livecam: ["webcams"],
  parking: ["greenPParking"],
  greenp: ["greenPParking"],
  carparks: ["greenPParking"],
  ev: ["evCharging"],
  charger: ["evCharging"],
  charging: ["evCharging"],
  tesla: ["evCharging"],
  bike: ["cyclingNetwork"],
  bikeway: ["cyclingNetwork"],
  cycling: ["cyclingNetwork"],
  bikepath: ["cyclingNetwork"],
  ravine: ["ravineProtection"],
  greenspace: ["ravineProtection"],
  naturalarea: ["ravineProtection"],
  crime: ["crimeIncidents"],
  mci: ["crimeIncidents"],
  assault: ["crimeIncidents"],
  robbery: ["crimeIncidents"],
  theft: ["crimeIncidents"],
  burglary: ["crimeIncidents"],
  breakenter: ["crimeIncidents"],
  autotheft: ["crimeIncidents"],
  division: ["policeDivisions"],
  police: ["policeDivisions"],
  aqhi: ["ecccAqhi"],
  airquality: ["ecccAqhi"],
  pollution: ["ecccAqhi"],
  smog: ["ecccAqhi"],
  tree: ["treeCanopy"],
  canopy: ["treeCanopy"],
  forest: ["treeCanopy"],
  greenspace: ["treeCanopy"],
  urbanforest: ["treeCanopy"],
  lake: ["lakeOntarioLevel"],
  water: ["lakeOntarioLevel"],
  waterlevel: ["lakeOntarioLevel"],
  lakeontario: ["lakeOntarioLevel"],
  bike: ["bikeShare"],
  bikeshare: ["bikeShare"],
  pbsc: ["bikeShare"],
  bixi: ["bikeShare"],
  childcare: ["childcare"],
  daycare: ["childcare"],
  flu: ["fluClinics"],
  clinic: ["fluClinics"],
  agco: ["agcoLicences"],
  liquor: ["agcoLicences"],
  beer: ["agcoLicences"],
  wine: ["agcoLicences"],
  "green roof": ["greenRoofPermits"],
  library: ["libraryBranches"],
  tpl: ["libraryBranches"],
  books: ["libraryBranches"],
  librarybranch: ["libraryBranches"],
  tpls: ["libraryBranches"],
  childcare: ["childcare"],
  daycare: ["childcare"],
  earlylearning: ["childcare"],
  preschool: ["childcare"],
  kindergarten: ["childcare"],
  flu: ["fluClinics"],
  clinic: ["fluClinics"],
  vaccination: ["fluClinics"],
  shot: ["fluClinics"],
  vaccine: ["fluClinics"],
};

export function resolveLayerLabel(
  def: LayerDefinition,
  tFn?: (key: string) => string,
): string {
  if (tFn) {
    const translated = tFn(I18N_PREFIX + def.i18nSuffix);
    if (translated && translated !== I18N_PREFIX + def.i18nSuffix)
      return translated;
  }
  return def.fallbackLabel;
}

export function bindLayerSearch(container: HTMLElement): void {
  const searchInput = container.querySelector(
    ".layer-search",
  ) as HTMLInputElement | null;
  if (!searchInput) return;
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const synonymHits = new Set<string>();
    if (q) {
      for (const [alias, keys] of Object.entries(LAYER_SYNONYMS)) {
        if (alias.includes(q)) keys.forEach((k) => synonymHits.add(k));
      }
    }
    container.querySelectorAll(".layer-toggle").forEach((label) => {
      const el = label as HTMLElement;
      if (el.hasAttribute("data-layer-hidden")) return;
      if (!q) {
        el.style.display = "";
        return;
      }
      const key = label.getAttribute("data-layer") || "";
      const text = label.textContent?.toLowerCase() || "";
      const match =
        text.includes(q) ||
        key.toLowerCase().includes(q) ||
        synonymHits.has(key);
      el.style.display = match ? "" : "none";
    });
  });
}
