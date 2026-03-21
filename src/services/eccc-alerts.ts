import { createCircuitBreaker } from "@/utils";
import { toApiUrl } from "@/services/runtime";
import { dispatchAlert } from "@/services/breaking-news-alerts";
import type { BreakingAlert } from "@/services/breaking-news-alerts";

export interface EcccAlert {
  source: string;
  title: string;
  link: string;
  pubDate: Date;
  isAlert: boolean;
  threat: {
    level: "critical" | "high" | "medium" | "low" | "info";
    category: string;
    confidence: number;
    source: string;
  };
  locationName: string;
  // Additional ECCC-specific metadata
  severityClass: "FLASH" | "PRIORITY" | "other";
  urgency: string;
  severity: string;
  certainty: string;
  description: string;
  filename: string;
}

export interface EcccAlertsResponse {
  items: EcccAlert[];
  count: number;
  source: string;
  timestamp: string;
}

export type AlertSeverity =
  | "Warning"
  | "Watch"
  | "Advisory"
  | "Statement"
  | "Other";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Circuit breaker with cache
const breaker = createCircuitBreaker<EcccAlertsResponse>({
  name: "ECCCAlerts",
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// Track already-dispatched alert IDs to avoid duplicates
const dispatchedAlerts = new Set<string>();
const DISPATCHED_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Classifies an ECCC alert into severity categories for UI display
 */
export function classifyAlertSeverity(alert: EcccAlert): AlertSeverity {
  const title = alert.title.toLowerCase();
  const event = alert.threat.category.toLowerCase();
  const combined = `${title} ${event}`;

  // Warnings are the most severe
  if (combined.includes("warning")) {
    return "Warning";
  }

  // Watches indicate conditions are favorable
  if (combined.includes("watch")) {
    return "Watch";
  }

  // Advisories are less severe but warrant attention
  if (combined.includes("advisory")) {
    return "Advisory";
  }

  // Statements are informational
  if (combined.includes("statement")) {
    return "Statement";
  }

  return "Other";
}

/**
 * Gets color for alert severity (RGB array)
 */
export function getEcccSeverityColor(severity: AlertSeverity): number[] {
  switch (severity) {
    case "Warning":
      return [220, 20, 60]; // Crimson red
    case "Watch":
      return [255, 140, 0]; // Dark orange
    case "Advisory":
      return [255, 215, 0]; // Gold
    case "Statement":
      return [100, 149, 237]; // Cornflower blue
    default:
      return [128, 128, 128]; // Gray
  }
}

/**
 * Cleans up old dispatch tracking entries
 */
function cleanupDispatchedEntries(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const id of dispatchedAlerts) {
    // Extract timestamp from the ID format
    const timestamp = parseInt(id.split("-").pop() || "0", 10);
    if (now - timestamp > DISPATCHED_TTL_MS) {
      toDelete.push(id);
    }
  }

  for (const id of toDelete) {
    dispatchedAlerts.delete(id);
  }
}

/**
 * Dispatches breaking news for severe weather alerts
 */
function dispatchSevereAlerts(alerts: EcccAlert[]): void {
  cleanupDispatchedEntries();

  const severeAlerts = alerts.filter((alert) => {
    const severity = classifyAlertSeverity(alert);
    return (
      severity === "Warning" ||
      (severity === "Watch" && alert.severityClass === "FLASH")
    );
  });

  for (const alert of severeAlerts) {
    const dispatchId = `eccc-alert-${alert.filename}`;

    if (dispatchedAlerts.has(dispatchId)) {
      continue;
    }

    dispatchedAlerts.add(dispatchId);

    const severity = classifyAlertSeverity(alert);
    const breakingAlert: BreakingAlert = {
      id: dispatchId,
      headline: alert.title,
      source: "Environment Canada",
      link: alert.link,
      threatLevel: severity === "Warning" ? "critical" : "high",
      timestamp: alert.pubDate,
      origin: "keyword_spike",
    };

    dispatchAlert(breakingAlert);
  }
}

/**
 * Fetches ECCC weather alerts for Ontario
 */
export async function fetchEcccAlerts(): Promise<EcccAlert[]> {
  const response = await breaker.execute(
    async () => {
      const url = toApiUrl("/api/eccc-ontario-alerts");
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.json();
    },
    {
      items: [],
      count: 0,
      source: "Environment Canada",
      timestamp: new Date().toISOString(),
    },
  );

  // Parse dates and enrich alerts
  const enrichedAlerts = response.items.map((item: any) => ({
    ...item,
    pubDate: new Date(item.pubDate),
    timestamp: new Date(item.pubDate).getTime(),
  }));

  // Dispatch breaking news for severe alerts
  dispatchSevereAlerts(enrichedAlerts);

  return enrichedAlerts;
}

/**
 * Gets unique alert types present in the data
 */
export function getAlertTypes(alerts: EcccAlert[]): string[] {
  const types = new Set(alerts.map((alert) => alert.threat.category));
  return Array.from(types).sort();
}

/**
 * Gets unique locations present in the data
 */
export function getAlertLocations(alerts: EcccAlert[]): string[] {
  const locations = new Set(alerts.map((alert) => alert.locationName));
  return Array.from(locations).sort();
}

/**
 * Converts alerts to map layer format with GeoJSON polygons
 * Note: Current ECCC API doesn't provide polygon geometries, so we return
 * alert points that can be displayed on the map
 */
export function alertsToMapLayer(alerts: EcccAlert[]): Array<{
  id: string;
  title: string;
  location: string;
  severity: AlertSeverity;
  color: number[];
  urgency: string;
  event: string;
}> {
  return alerts.map((alert) => {
    const severity = classifyAlertSeverity(alert);
    return {
      id: alert.filename,
      title: alert.title,
      location: alert.locationName,
      severity,
      color: getEcccSeverityColor(severity),
      urgency: alert.urgency,
      event: alert.threat.category,
    };
  });
}
