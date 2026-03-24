/**
 * Config: Council Votes & Ward Boundaries
 * Defines Toronto ward boundary types and styling
 */

export interface WardBoundary {
  id: string;
  name: string;
  number: number;
  geometry: any;
  properties: any;
}

export type WardBoundaryLayerProps = {
  getFillColor: (d: any) => number[];
  getLineColor: (d: any) => number[];
  getLineWidth: (d: any) => number;
  pickable: boolean;
  onClick: (info: any) => void;
};

/**
 * Get ward color (consistent based on ward number)
 */
export function getWardColor(number: number): number[] {
  const h = ((number * 137.5) % 360) / 360; // Golden angle for nice distribution
  return hslToRgb(h, 0.6, 0.55);
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
 * Default layer props for ward boundaries
 */
export const DEFAULT_WARD_BOUNDARY_PROPS: WardBoundaryLayerProps = {
  getFillColor: (d: any) => {
    const number = d.properties?.AREA_S_CD || d.properties?.WARD_NUM || 1;
    const color = getWardColor(number);
    return [...color, 100]; // Add alpha
  },
  getLineColor: (d: any) => [59, 130, 246, 200],
  getLineWidth: () => 2,
  pickable: true,
  onClick: (info: any) => {
    if (info.object) {
      console.log('Ward clicked:', info.object.properties);
    }
  },
};

/**
 * Data source URL for ward boundaries
 */
export const WARD_BOUNDARIES_SOURCE_URL = '/api/ward-boundaries';

/**
 * Refresh interval (in milliseconds)
 */
export const WARD_BOUNDARIES_REFRESH_INTERVAL = 60 * 60 * 24 * 1000; // 24 hours