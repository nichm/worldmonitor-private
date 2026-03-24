/**
 * Urban Heat Island Configuration
 *
 * Toronto urban heat island zones - areas with elevated temperatures due to
 * urban development, impervious surfaces, and limited green space.
 *
 * Data sources:
 * - Seed data based on urban development patterns
 * - Future: University of Toronto School of Cities
 * - Future: HealthyPlan.City heat vulnerability indices
 */

export interface UrbanHeatZone {
  id: string;
  name: string;
  description: string;
  heatIndex: number; // 0-100 scale
  temperatureDelta: number; // Degrees above surrounding rural areas
  imperviousSurface: number; // Percentage
  greenSpace: number; // Percentage
  populationDensity: number; // People per sq km
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  coordinates: number[][]; // Polygon coordinates [lon, lat]
}

export interface UrbanHeatSummary {
  totalZones: number;
  averageHeatIndex: number;
  criticalZones: number;
  highZones: number;
  mediumZones: number;
  lowZones: number;
  highestRiskZone: UrbanHeatZone | null;
}

/**
 * Get color for heat index (0-100 scale)
 * Returns hex color code for choropleth visualization
 */
export function getHeatIndexColor(heatIndex: number): string {
  if (heatIndex >= 85) return '#ef4444'; // Red - critical
  if (heatIndex >= 75) return '#f97316'; // Orange - high
  if (heatIndex >= 65) return '#eab308'; // Yellow - medium
  return '#22c55e'; // Green - low
}

/**
 * Get color for risk level
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#6b7280';
  }
}

/**
 * Summarize urban heat zones
 */
export function summarizeUrbanHeat(zones: UrbanHeatZone[]): UrbanHeatSummary {
  if (zones.length === 0) {
    return {
      totalZones: 0,
      averageHeatIndex: 0,
      criticalZones: 0,
      highZones: 0,
      mediumZones: 0,
      lowZones: 0,
      highestRiskZone: null,
    };
  }

  const totalHeatIndex = zones.reduce((sum, z) => sum + z.heatIndex, 0);
  const averageHeatIndex = Math.round(totalHeatIndex / zones.length);

  const criticalZones = zones.filter(z => z.riskLevel === 'critical').length;
  const highZones = zones.filter(z => z.riskLevel === 'high').length;
  const mediumZones = zones.filter(z => z.riskLevel === 'medium').length;
  const lowZones = zones.filter(z => z.riskLevel === 'low').length;

  // Find zone with highest heat index
  const highestRiskZone = zones.reduce((max, z) =>
    z.heatIndex > max.heatIndex ? z : max, zones[0]);

  return {
    totalZones: zones.length,
    averageHeatIndex,
    criticalZones,
    highZones,
    mediumZones,
    lowZones,
    highestRiskZone,
  };
}

/**
 * Convert zone to GeoJSON Feature
 */
export function zoneToGeoJSONFeature(zone: UrbanHeatZone): GeoJSON.Feature {
  return {
    type: 'Feature',
    id: zone.id,
    properties: {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      heatIndex: zone.heatIndex,
      temperatureDelta: zone.temperatureDelta,
      imperviousSurface: zone.imperviousSurface,
      greenSpace: zone.greenSpace,
      populationDensity: zone.populationDensity,
      riskLevel: zone.riskLevel,
      color: getHeatIndexColor(zone.heatIndex),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [zone.coordinates],
    },
  };
}

/**
 * Convert zones to GeoJSON FeatureCollection
 */
export function zonesToGeoJSON(zones: UrbanHeatZone[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map(zoneToGeoJSONFeature),
  };
}

/**
 * Get risk level label
 */
export function getRiskLevelLabel(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Unknown';
  }
}