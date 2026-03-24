/**
 * Config: Neighbourhood Profiles & Demographics
 * Defines Toronto neighbourhood boundary types and styling
 */

export interface Neighbourhood {
  id: string;
  name: string;
  geometry: any;
  properties: any;
}

export type NeighbourhoodLayerProps = {
  getFillColor: (d: any) => number[];
  getLineColor: (d: any) => number[];
  getLineWidth: (d: any) => number;
  pickable: boolean;
  onClick: (info: any) => void;
};

/**
 * Get neighbourhood color (consistent based on name)
 */
export function getNeighbourhoodColor(name: string): number[] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return hslToRgb(h / 360, 0.5, 0.6);
}

/**
 * HSL to RGB conversion
 */
function hslToRgb(h: number, s: number, l: number): number[] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Default layer props for neighbourhoods
 */
export const DEFAULT_NEIGHBOURHOOD_PROPS: NeighbourhoodLayerProps = {
  getFillColor: (d: any) => {
    const name = d.properties?.AREA_NAME || d.properties?.name || 'Unknown';
    const color = getNeighbourhoodColor(name);
    return [...color, 100]; // Add alpha
  },
  getLineColor: (d: any) => [156, 163, 175, 150],
  getLineWidth: () => 1,
  pickable: true,
  onClick: (info: any) => {
    if (info.object) {
      console.log('Neighbourhood clicked:', info.object.properties);
    }
  },
};

/**
 * Data source URL for neighbourhoods
 */
export const NEIGHBOURHOODS_SOURCE_URL = '/api/neighbourhoods';

/**
 * Refresh interval (in milliseconds)
 */
export const NEIGHBOURHOODS_REFRESH_INTERVAL = 60 * 60 * 24 * 1000; // 24 hours