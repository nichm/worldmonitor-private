// Base configuration shared across all variants
import type { PanelConfig, MapLayers } from '@/types';

// Shared exports (re-exported by all variants)
export { SECTORS, COMMODITIES, MARKET_SYMBOLS } from '../markets';
export { UNDERSEA_CABLES } from '../geo';
export { AI_DATA_CENTERS } from '../ai-datacenters';

// Idle pause duration - shared across map and stream panels (5 minutes)
export const IDLE_PAUSE_MS = 5 * 60 * 1000;

// Refresh intervals (ms) - shared across all variants
export const REFRESH_INTERVALS = {
  feeds: 20 * 60 * 1000,
  markets: 12 * 60 * 1000,
  crypto: 12 * 60 * 1000,
  predictions: 15 * 60 * 1000,
  forecasts: 30 * 60 * 1000,
  ais: 15 * 60 * 1000,
  pizzint: 10 * 60 * 1000,
  natural: 60 * 60 * 1000,
  weather: 10 * 60 * 1000,
  fred: 6 * 60 * 60 * 1000,
  oil: 6 * 60 * 60 * 1000,
  spending: 6 * 60 * 60 * 1000,
  bis: 6 * 60 * 60 * 1000,
  firms: 30 * 60 * 1000,
  cables: 30 * 60 * 1000,
  cableHealth: 2 * 60 * 60 * 1000,
  flights: 2 * 60 * 60 * 1000,
  cyberThreats: 10 * 60 * 1000,
  stockAnalysis: 15 * 60 * 1000,
  dailyMarketBrief: 60 * 60 * 1000,
  stockBacktest: 4 * 60 * 60 * 1000,
  serviceStatus: 3 * 60 * 1000,
  stablecoins: 15 * 60 * 1000,
  etfFlows: 15 * 60 * 1000,
  macroSignals: 15 * 60 * 1000,
  strategicPosture: 15 * 60 * 1000,
  strategicRisk: 5 * 60 * 1000,
  temporalBaseline: 10 * 60 * 1000,
  tradePolicy: 60 * 60 * 1000,
  supplyChain: 60 * 60 * 1000,
  telegramIntel: 60 * 1000,
  gulfEconomies: 10 * 60 * 1000,
  groceryBasket: 6 * 60 * 60 * 1000,
  intelligence: 15 * 60 * 1000,
  correlationEngine: 5 * 60 * 1000,
  // Real-time Toronto layers (should refresh frequently)
  torontoFire: 60 * 1000, // 60s — active incidents change fast
  ttcVehicles: 30 * 1000, // 30s — vehicles move constantly
  bikeShare: 60 * 1000, // 60s — station status changes moderately
  ecccAqhi: 300 * 1000, // 300s (5 min) — hourly readings, no need for sub-minute
  roadConstruction: 300 * 1000, // 300s — updates during work hours
  crimeIncidents: 300 * 1000, // 300s — moderate update frequency
  protestEvents: 600 * 1000, // 600s — protest events
  ontarioWildfires: 600 * 1000, // 600s — fire season
  floodingComposite: 300 * 1000, // 300s — water levels change
  torontoHydroOutages: 300 * 1000, // 300s — outage updates
  // Semi-static Toronto layers (refresh less often)
  communityHousing: 3600 * 1000, // 1h — rarely changes
  parksRecreationStatic: 30 * 24 * 60 * 60 * 1000,
  parksRecreationLive: 15 * 60 * 1000,
  schools: 24 * 60 * 60 * 1000, // 24h — basically never changes
  evCharging: 120 * 1000, // 120s — availability changes
  cyclingNetwork: 24 * 60 * 60 * 1000, // 24h — infrastructure rarely changes
  ravineProtection: 24 * 60 * 60 * 1000, // 24h — bylaw amendments rare
  treeCanopy: 24 * 60 * 60 * 1000, // 24h — canopy data stable
  libraryBranches: 3600 * 1000, // 1h — library data
  federalRidings: 24 * 60 * 60 * 1000, // 24h — electoral boundaries
  courtFacilities: 24 * 60 * 60 * 1000, // 24h — court facilities
  policeDivisions: 24 * 60 * 60 * 1000, // 24h — static boundaries
  childcare: 3600 * 1000, // 1h — childcare data
  fluClinics: 24 * 60 * 60 * 1000, // 24h — seasonal, daily updates
  agcoLicences: 24 * 60 * 60 * 1000, // 24h — licence updates
  greenRoofPermits: 24 * 60 * 60 * 1000, // 24h — permit data
  electionData: 24 * 60 * 60 * 1000, // 24h — election data
  urbanHeat: 24 * 60 * 60 * 1000, // 24h — urban heat data
  mlsInvestigations: 30 * 60 * 1000, // 30 min — MLS data
  trafficSignals: 24 * 60 * 60 * 1000, // 24h — signal infrastructure
  lakeOntarioLevel: 5 * 60 * 1000, // 5 minutes — water level updates frequently
};

// Monitor colors - shared
export const MONITOR_COLORS = [
  '#44ff88',
  '#ff8844',
  '#4488ff',
  '#ff44ff',
  '#ffff44',
  '#ff4444',
  '#44ffff',
  '#88ff44',
  '#ff88ff',
  '#88ffff',
];

// Storage keys - shared
export const STORAGE_KEYS = {
  panels: 'worldmonitor-panels',
  monitors: 'worldmonitor-monitors',
  mapLayers: 'worldmonitor-layers',
  disabledFeeds: 'worldmonitor-disabled-feeds',
  liveChannels: 'worldmonitor-live-channels',
  mapMode: 'worldmonitor-map-mode',          // 'flat' | 'globe'
  activeChannel: 'worldmonitor-active-channel',
  webcamPrefs: 'worldmonitor-webcam-prefs',
} as const;

// Type definitions for variant configs
export interface VariantConfig {
  name: string;
  description: string;
  panels: Record<string, PanelConfig>;
  mapLayers: MapLayers;
  mobileMapLayers: MapLayers;
}
