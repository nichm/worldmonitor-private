/**
 * Green P Parking Lots (2019 Snapshot)
 * Source: City of Toronto Open Data Portal — CKAN JSON (frozen 2019)
 * Note: Data frozen at 2019 — locations approximate. Use parking.greenp.com for live availability.
 */

export interface GreenPParkingLot {
  _id: number;
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  rate1Hr: number;
  rate2Hr: number;
  rateMax: number;
  paymentType: string;
  type: string;
  notes?: string;
}

export const GREEN_P_PARKING_URL =
  'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/b66466c3-69c8-4825-9c8b-04b270069193/resource/8549d588-30b0-482e-b872-b21beefdda22/download/green-p-parking-2019.json';

export let greenPParkingLots: GreenPParkingLot[] = [];

function parseLot(item: Record<string, unknown>): GreenPParkingLot | null {
  const lat = Number(item.lat || item.Lat || item.LAT);
  const lng = Number(item.lng || item.Lng || item.LON || item.lon);
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

  return {
    _id: (item._id as number) ?? 0,
    id: (item.id as string) ?? '',
    name: (item.name || item.NAME || '') as string,
    address: (item.address || item.ADDRESS || '') as string,
    lat,
    lng,
    capacity: Number(item.capacity || item.Capacity || 0),
    rate1Hr: Number(item.rate1hr || item.RATE1HR || 0),
    rate2Hr: Number(item.rate2hr || item.RATE2HR || 0),
    rateMax: Number(item.ratemax || item.RATEMAX || 0),
    paymentType: (item.paymenttype || item.PAYMENTTYPE || '') as string,
    type: (item.type || item.TYPE || '') as string,
    notes: (item.notes || item.NOTES) as string | undefined,
  };
}

export async function fetchGreenPParking(): Promise<GreenPParkingLot[]> {
  try {
    const res = await fetch(GREEN_P_PARKING_URL);
    if (!res.ok) throw new Error(`Green P Parking API error: ${res.status}`);
    const data = await res.json();

    // Handle both array and object response formats
    const lots: GreenPParkingLot[] = [];
    const items = Array.isArray(data) ? data : (data?.data ?? data?.features ?? []);

    for (const item of items) {
      const lot = parseLot(item as Record<string, unknown>);
      if (lot) lots.push(lot);
    }

    greenPParkingLots = lots;
    return lots;
  } catch (error) {
    console.error('[App] Green P Parking fetch failed:', error);
    return [];
  }
}

/** Derive summary stats for the panel */
export interface GreenPParkingSummary {
  totalLots: number;
  totalCapacity: number;
  byType: Record<string, number>;
  byPaymentType: Record<string, number>;
  avgRate1Hr: number;
}

export function summarizeGreenPParking(lots: GreenPParkingLot[]): GreenPParkingSummary {
  const byType: Record<string, number> = {};
  const byPaymentType: Record<string, number> = {};

  let totalCapacity = 0;
  let totalRate1Hr = 0;
  let rateCount = 0;

  for (const lot of lots) {
    totalCapacity += lot.capacity;

    const type = lot.type || 'Unknown';
    byType[type] = (byType[type] || 0) + 1;

    const payment = lot.paymentType || 'Unknown';
    byPaymentType[payment] = (byPaymentType[payment] || 0) + 1;

    if (lot.rate1Hr > 0) {
      totalRate1Hr += lot.rate1Hr;
      rateCount++;
    }
  }

  return {
    totalLots: lots.length,
    totalCapacity,
    byType,
    byPaymentType,
    avgRate1Hr: rateCount > 0 ? totalRate1Hr / rateCount : 0,
  };
}