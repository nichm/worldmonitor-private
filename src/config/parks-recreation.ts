/**
 * Parks & Recreation Facilities — typed interfaces and amenity definitions
 *
 * Data sources:
 * - Static GeoJSON: CKAN package cbea3a67-9168-4c6d-8186-16ac1a795b5b, resource f6cdcd50-da7b-4ede-8e60-c3cdba70b559
 * - Live status: https://www.toronto.ca/data/parks/live/centres.json
 */

/** Amenity types with their display metadata */
export type AmenityType =
  | "pool"
  | "rink"
  | "gym"
  | "playground"
  | "field"
  | "court"
  | "track"
  | "splash_pad"
  | "community_centre"
  | "other";

export const AMENITY_CONFIG: Record<
  AmenityType,
  { label: string; icon: string; color: string; colorRgb: [number, number, number] }
> = {
  pool: { label: "Pool", icon: "🏊", color: "#3b82f6", colorRgb: [59, 130, 246] },
  rink: { label: "Rink", icon: "⛸️", color: "#06b6d4", colorRgb: [6, 182, 212] },
  gym: { label: "Gym", icon: "🏋️", color: "#8b5cf6", colorRgb: [139, 92, 246] },
  playground: { label: "Playground", icon: "🎠", color: "#f59e0b", colorRgb: [245, 158, 11] },
  field: { label: "Field", icon: "⚽", color: "#22c55e", colorRgb: [34, 197, 94] },
  court: { label: "Court", icon: "🎾", color: "#ef4444", colorRgb: [239, 68, 68] },
  track: { label: "Track", icon: "🏃", color: "#14b8a6", colorRgb: [20, 184, 166] },
  splash_pad: { label: "Splash Pad", icon: "💦", color: "#0ea5e9", colorRgb: [14, 165, 233] },
  community_centre: { label: "Community Centre", icon: "🏠", color: "#f97316", colorRgb: [249, 115, 22] },
  other: { label: "Other", icon: "📍", color: "#6b7280", colorRgb: [107, 114, 128] },
};

/** Live status for a facility */
export type FacilityLiveStatus = "open" | "closed" | "limited" | "unknown";

/** A single parks/recreation facility (merged from static GeoJSON + live status) */
export interface ParksRecreationFacility {
  id: string;
  name: string;
  address: string;
  amenityType: AmenityType;
  amenityFlags: AmenityType[];
  lat: number;
  lon: number;
  ward?: string;
  description?: string;
  /** Live operating status from centres.json */
  liveStatus: FacilityLiveStatus;
  /** Live status detail from centres.json */
  liveDetail?: string;
  /** Last updated timestamp (ISO string) */
  updatedAt?: string;
}

/** Response shape from the Edge Function */
export interface ParksRecreationResponse {
  facilities: ParksRecreationFacility[];
  total: number;
  lastUpdated: string;
  staticLastUpdated: string;
  liveLastUpdated: string;
}

/** Amenity filter legend for help text */
export const AMENITY_FILTER_LEGEND: string = Object.entries(AMENITY_CONFIG)
  .map(([, cfg]) => `${cfg.icon} ${cfg.label}`)
  .join("  ·  ");
