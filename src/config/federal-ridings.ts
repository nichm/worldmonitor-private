/**
 * Config: Federal Riding Boundaries
 * Defines federal electoral district boundary types and styling
 */

export interface FederalRiding {
  name: string;
  id: string;
  province: string;
  geometry: any;
}

export type FederalRidingLayerProps = {
  getFillColor: (d: any) => number[];
  getLineColor: (d: any) => number[];
  getLineWidth: (d: any) => number;
  pickable: boolean;
  onClick: (info: any) => void;
};

/**
 * Get federal riding styling colors
 */
export function getFederalRidingColor(ridingName: string): number[] {
  // Generate consistent color based on riding name
  let hash = 0;
  for (let i = 0; i < ridingName.length; i++) {
    hash = ridingName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return hslToRgb(h / 360, 0.6, 0.5);
}

/**
 * HSL to RGB conversion
 */
function hslToRgb(h: number, s: number, l: number): number[] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
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
 * Default layer props for federal riding boundaries
 */
export const DEFAULT_FEDERAL_RIDING_PROPS: FederalRidingLayerProps = {
  getFillColor: (d: any) => {
    const name = d.properties?.name || 'Unknown';
    const color = getFederalRidingColor(name);
    return [...color, 80]; // Add alpha
  },
  getLineColor: (d: any) => [59, 130, 246, 200],
  getLineWidth: () => 2,
  pickable: true,
  onClick: (info: any) => {
    if (info.object) {
      console.log('Federal riding clicked:', info.object.properties);
    }
  },
};

/**
 * Data source URL for federal ridings
 */
export const FEDERAL_RIDINGS_SOURCE_URL = '/api/federal-ridings';

/**
 * Refresh interval (in milliseconds)
 */
export const FEDERAL_RIDINGS_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour