/**
 * Election Data - Polling Stations and Electoral Boundaries
 * Source: API
 */

export interface PollingStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  ward: string;
  electoralDistrict: string;
  accessibility: boolean;
}

export interface ElectoralBoundary {
  type: 'Feature';
  properties: {
    name: string;
    id: string;
  };
  geometry: GeoJSON.Polygon;
}

export interface ElectoralBoundaries {
  type: 'FeatureCollection';
  features: ElectoralBoundary[];
}

export interface ElectionDataResponse {
  pollingStations: PollingStation[];
  electoralBoundaries: ElectoralBoundaries;
  metadata: {
    totalStations: number;
    lastUpdated: string;
    note?: string;
  };
}