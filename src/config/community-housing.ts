/**
 * Toronto Community Housing Buildings
 * Source: City of Toronto Open Data Portal — GeoJSON (EPSG:4326)
 */

export interface CommunityHousingBuilding {
  _id: number;
  bldId: number;
  devId: number;
  devName: string;
  neighbourhoodNum: number;
  policeDiv: number;
  postalCode: string;
  totalUnits: number;
  marketUnits: number;
  rgiUnits: number;
  yearBuilt: number;
  buildingTypo: string | null;
  scattered: string;
  buildingForm: string;
  floorsAboveGrade: number;
  buildingDesc: string;
  lat: number;
  lon: number;
}

/** Derive summary stats for the panel */
export interface CommunityHousingSummary {
  totalBuildings: number;
  totalUnits: number;
  totalRgiUnits: number;
  totalMarketUnits: number;
  byBuildingForm: Record<string, number>;
  byPoliceDivision: Record<string, number>;
  topDevelopments: Array<{ name: string; buildings: number; units: number }>;
}

export function summarizeCommunityHousing(buildings: CommunityHousingBuilding[]): CommunityHousingSummary {
  const byBuildingForm: Record<string, number> = {};
  const byPoliceDivision: Record<string, number> = {};
  const devMap = new Map<number, { buildings: number; units: number }>();

  let totalUnits = 0;
  let totalRgiUnits = 0;
  let totalMarketUnits = 0;

  for (const b of buildings) {
    totalUnits += b.totalUnits;
    totalRgiUnits += b.rgiUnits;
    totalMarketUnits += b.marketUnits;

    const form = b.buildingForm || 'Unknown';
    byBuildingForm[form] = (byBuildingForm[form] || 0) + 1;

    const div = String(b.policeDiv);
    byPoliceDivision[div] = (byPoliceDivision[div] || 0) + 1;

    const existing = devMap.get(b.devId);
    if (existing) {
      existing.buildings++;
      existing.units += b.totalUnits;
    } else {
      devMap.set(b.devId, { buildings: 1, units: b.totalUnits });
    }
  }

  const topDevelopments = Array.from(devMap.entries())
    .map(([id, v]) => ({
      name: buildings.find((b) => b.devId === id)?.devName || `Development ${id}`,
      buildings: v.buildings,
      units: v.units,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 10);

  return {
    totalBuildings: buildings.length,
    totalUnits,
    totalRgiUnits,
    totalMarketUnits,
    byBuildingForm,
    byPoliceDivision,
    topDevelopments,
  };
}
