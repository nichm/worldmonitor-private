import type { MapLayers } from "@/types";

export interface TTCVehicle {
  id: string;
  routeId: string;
  routeType: string;
  latitude: number;
  longitude: number;
  bearing: number;
  timestamp: string;
}

export const TTC_VEHICLES_CONFIG = {
  enabled: true,
  refreshMs: 60 * 1000, // 60 seconds
  dataSourceId: "ttc_vehicles" as const,
  mapLayerKey: "ttcVehicles" as keyof MapLayers,
  panelKey: "ttc-vehicles",
  priority: 1, // P1 - ON by default
};

export function getTTCVehicleColor(routeId: string): string {
  // Color by route type for visual distinction
  const streetcarColors: Record<string, string> = {
    "501": "#FF0000", // Queen - Red
    "504": "#00FF00", // King - Green
    "505": "#0000FF", // Dundas - Blue
    "506": "#FFFF00", // Carlton - Yellow
    "509": "#FF00FF", // Harbourfront - Magenta
    "510": "#00FFFF", // Spadina - Cyan
    "512": "#FFA500", // St. Clair - Orange
  };
  return streetcarColors[routeId] || "#888888"; // Default gray for buses/unlisted
}

export function getTTCVehicleRadius(routeType: string): number {
  return routeType === "Streetcar" ? 4 : 3; // Streetcars slightly larger
}