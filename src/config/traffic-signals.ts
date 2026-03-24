/**
 * Config: Traffic Signal Locations
 * Defines traffic signal types and styling
 */

export interface TrafficSignal {
  id: string;
  type: string;
  status: string;
  intersection: string;
  geometry: any;
}

export type TrafficSignalLayerProps = {
  getFillColor: (d: any) => number[];
  getRadius: (d: any) => number;
  pickable: boolean;
  onClick: (info: any) => void;
};

/**
 * Get signal color by status
 */
export function getSignalColor(status: string): number[] {
  switch (status) {
    case 'Active':
      return [34, 197, 94, 200]; // Green
    case 'Inactive':
      return [239, 68, 68, 200]; // Red
    case 'Maintenance':
      return [245, 158, 11, 200]; // Orange
    default:
      return [107, 114, 128, 200]; // Gray
  }
}

/**
 * Get signal color by type
 */
export function getSignalTypeColor(type: string): number[] {
  switch (type) {
    case 'Traffic Signal':
      return [34, 197, 94, 200]; // Green
    case 'Pedestrian Signal':
      return [59, 130, 246, 200]; // Blue
    case 'Traffic Circle':
      return [168, 85, 247, 200]; // Purple
    default:
      return [107, 114, 128, 200]; // Gray
  }
}

/**
 * Default layer props for traffic signals
 */
export const DEFAULT_TRAFFIC_SIGNAL_PROPS: TrafficSignalLayerProps = {
  getFillColor: (d: any) => getSignalColor(d.properties?.status || 'Unknown'),
  getRadius: () => 15,
  pickable: true,
  onClick: (info: any) => {
    if (info.object) {
      console.log('Traffic signal clicked:', info.object.properties);
    }
  },
};

/**
 * Data source URL for traffic signals
 */
export const TRAFFIC_SIGNALS_SOURCE_URL = '/api/traffic-signals';

/**
 * Refresh interval (in milliseconds)
 */
export const TRAFFIC_SIGNALS_REFRESH_INTERVAL = 60 * 60 * 24 * 1000; // 24 hours