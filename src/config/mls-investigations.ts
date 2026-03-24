/**
 * Config: ML&S Investigation Activity
 * Defines Municipal Licensing & Standards investigation types and styling
 */

export interface MLSInvestigation {
  id: string;
  type: string;
  status: string;
  date: string;
  address: string;
  geometry: any;
}

export type MLSInvestigationLayerProps = {
  getFillColor: (d: any) => number[];
  getRadius: (d: any) => number;
  pickable: boolean;
  onClick: (info: any) => void;
};

/**
 * Get investigation color by status
 */
export function getInvestigationColor(status: string): number[] {
  switch (status) {
    case 'Active':
      return [239, 68, 68, 200]; // Red
    case 'Resolved':
      return [34, 197, 94, 200]; // Green
    case 'Under Review':
      return [245, 158, 11, 200]; // Orange
    default:
      return [107, 114, 128, 200]; // Gray
  }
}

/**
 * Get investigation color by type
 */
export function getInvestigationTypeColor(type: string): number[] {
  switch (type) {
    case 'Property Standards':
      return [239, 68, 68, 200]; // Red
    case 'Noise Complaint':
      return [245, 158, 11, 200]; // Orange
    case 'Zoning':
      return [59, 130, 246, 200]; // Blue
    default:
      return [107, 114, 128, 200]; // Gray
  }
}

/**
 * Default layer props for ML&S investigations
 */
export const DEFAULT_MLS_INVESTIGATION_PROPS: MLSInvestigationLayerProps = {
  getFillColor: (d: any) => getInvestigationColor(d.properties?.status || 'Unknown'),
  getRadius: () => 30,
  pickable: true,
  onClick: (info: any) => {
    if (info.object) {
      console.log('ML&S investigation clicked:', info.object.properties);
    }
  },
};

/**
 * Data source URL for ML&S investigations
 */
export const MLS_INVESTIGATIONS_SOURCE_URL = '/api/mls-investigations';

/**
 * Refresh interval (in milliseconds)
 */
export const MLS_INVESTIGATIONS_REFRESH_INTERVAL = 60 * 60 * 6 * 1000; // 6 hours