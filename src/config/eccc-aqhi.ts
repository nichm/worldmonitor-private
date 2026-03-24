/**
 * ECCC Air Quality Health Index
 * Source: Environment and Climate Change Canada API
 */

export interface AQHIReading {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  aqhi: number;
  aqhiCategory: string;
  stationName: string;
  province: string;
  stationId: string;
}

export function getAQHIColor(aqhi: number): [number, number, number, number] {
  if (aqhi <= 3) {
    return [34, 197, 94, 200]; // green (low risk)
  } else if (aqhi <= 6) {
    return [234, 179, 8, 200]; // yellow (moderate risk)
  } else {
    return [239, 68, 68, 200]; // red (high risk)
  }
}

export function getAQHICategory(aqhi: number): string {
  if (aqhi <= 3) {
    return "Low Risk";
  } else if (aqhi <= 6) {
    return "Moderate Risk";
  } else if (aqhi <= 9) {
    return "High Risk";
  } else {
    return "Very High Risk";
  }
}

export function getAQHISummary(readings: AQHIReading[]) {
  if (readings.length === 0) {
    return {
      total: 0,
      lowRisk: 0,
      moderateRisk: 0,
      highRisk: 0,
      veryHighRisk: 0,
      averageAQHI: 0,
      maxAQHI: 0,
    };
  }

  const summary = {
    total: readings.length,
    lowRisk: 0,
    moderateRisk: 0,
    highRisk: 0,
    veryHighRisk: 0,
    averageAQHI: 0,
    maxAQHI: 0,
  };

  let totalAQHI = 0;
  let maxAQHI = 0;

  for (const reading of readings) {
    totalAQHI += reading.aqhi;
    maxAQHI = Math.max(maxAQHI, reading.aqhi);

    if (reading.aqhi <= 3) {
      summary.lowRisk++;
    } else if (reading.aqhi <= 6) {
      summary.moderateRisk++;
    } else if (reading.aqhi <= 9) {
      summary.highRisk++;
    } else {
      summary.veryHighRisk++;
    }
  }

  summary.averageAQHI = Math.round(totalAQHI / readings.length);
  summary.maxAQHI = maxAQHI;

  return summary;
}