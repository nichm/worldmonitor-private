import { createCircuitBreaker } from "@/utils";
import { toApiUrl } from "@/services/runtime";
import { dispatchAlert } from "@/services/breaking-news-alerts";
import type { BreakingAlert } from "@/services/breaking-news-alerts";
import { dataFreshness } from "@/services/data-freshness";

export interface TrcaFloodMessage {
  id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  messageType: string;
  severity: number;
  affectedAreas: string[] | null;
  category: "water_status" | "advisory";
  pubDate: string;
  timestamp: number;
}

export interface TrcaFloodsResponse {
  messages: TrcaFloodMessage[];
  count: number;
  timestamp: string;
}

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Circuit breaker with cache
const breaker = createCircuitBreaker<TrcaFloodsResponse>({
  name: "TrcaFloods",
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: true,
});

// Track already-dispatched flood warnings to avoid duplicates
const dispatchedWarnings = new Set<string>();
const DISPATCHED_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// Update listeners
const listeners: Set<(messages: TrcaFloodMessage[]) => void> = new Set();
let pollingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Cleans up old dispatch tracking entries
 */
function cleanupDispatchedEntries(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const id of dispatchedWarnings) {
    const timestamp = parseInt(id.split("-").pop() || "0", 10);
    if (now - timestamp > DISPATCHED_TTL_MS) {
      toDelete.push(id);
    }
  }

  for (const id of toDelete) {
    dispatchedWarnings.delete(id);
  }
}

/**
 * Dispatches breaking news for Flood Warnings
 */
function dispatchFloodWarnings(messages: TrcaFloodMessage[]): void {
  cleanupDispatchedEntries();

  const floodWarnings = messages.filter((msg) =>
    msg.messageType?.toUpperCase().includes("FLOOD WARNING"),
  );

  for (const warning of floodWarnings) {
    const dispatchId = `trca-flood-${warning.id}`;

    if (dispatchedWarnings.has(dispatchId)) {
      continue;
    }

    dispatchedWarnings.add(dispatchId);

    const areasText =
      warning.affectedAreas && warning.affectedAreas.length > 0
        ? ` affecting ${warning.affectedAreas.join(", ")}`
        : "";

    const alert: BreakingAlert = {
      id: dispatchId,
      headline: `TRCA Flood Warning${areasText}`,
      source: "Toronto Region Conservation Authority",
      link: warning.link || "https://trca.ca",
      threatLevel: "critical",
      timestamp: new Date(warning.pubDate),
      origin: "keyword_spike",
    };

    dispatchAlert(alert);
  }
}

/**
 * Fetches TRCA flood messages
 */
export async function fetchTrcaFloods(): Promise<TrcaFloodMessage[]> {
  const response = await breaker.execute(
    async () => {
      const url = toApiUrl("/api/trca-floods");
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.json();
    },
    { messages: [], count: 0, timestamp: new Date().toISOString() },
  );

  // Update data freshness tracker
  if (response.messages && response.messages.length > 0) {
    dataFreshness.recordUpdate("trca_floods", response.messages.length);
  }

  // Dispatch breaking news for Flood Warnings
  dispatchFloodWarnings(response.messages || []);

  return response.messages || [];
}

/**
 * Gets the threat level for a message severity
 */
export function getSeverityThreatLevel(
  severity: number,
): "critical" | "high" | "medium" | "low" | "info" {
  switch (severity) {
    case 4:
      return "critical";
    case 3:
      return "high";
    case 2:
      return "medium";
    case 1:
      return "low";
    default:
      return "info";
  }
}

/**
 * Gets the color for a message severity (RGB format for map layers)
 */
export function getTrcaSeverityColor(severity: number): number[] {
  switch (severity) {
    case 4: // Flood Warning
      return [220, 38, 38]; // Critical red
    case 3: // Flood Watch
      return [245, 158, 11]; // High orange
    case 2: // Water Safety Statement
      return [59, 130, 246]; // Medium blue
    case 1: // Watershed Conditions Statement
      return [100, 116, 139]; // Low gray
    default:
      return [156, 163, 175]; // Info light gray
  }
}

/**
 * Converts flood messages to map layer format
 */
export function floodsToMapLayer(
  messages: TrcaFloodMessage[],
): TrcaFloodMessage[] {
  // For now, return all advisory messages
  // In the future, this could be enhanced with actual gauge locations
  return messages.filter((msg) => msg.category === "advisory");
}

/**
 * Registers a listener for flood updates
 */
export function onTrcaFloodsUpdate(
  callback: (messages: TrcaFloodMessage[]) => void,
): void {
  listeners.add(callback);
}

/**
 * Removes a flood update listener
 */
export function offTrcaFloodsUpdate(
  callback: (messages: TrcaFloodMessage[]) => void,
): void {
  listeners.delete(callback);
}

/**
 * Notifies all listeners of new flood data
 */
function notifyListeners(messages: TrcaFloodMessage[]): void {
  for (const listener of listeners) {
    try {
      listener(messages);
    } catch (error) {
      console.error("[TRCA Floods] Listener error:", error);
    }
  }
}

/**
 * Starts polling for flood updates
 */
export function startTrcaFloodsPolling(): void {
  if (pollingInterval) return;

  // Initial fetch
  fetchTrcaFloods()
    .then((messages) => {
      notifyListeners(messages);
    })
    .catch((error) => {
      console.error("[TRCA Floods] Initial fetch failed:", error);
    });

  // Set up polling
  pollingInterval = setInterval(async () => {
    try {
      const messages = await fetchTrcaFloods();
      notifyListeners(messages);
    } catch (error) {
      console.error("[TRCA Floods] Polling fetch failed:", error);
    }
  }, POLLING_INTERVAL_MS);
}

/**
 * Stops polling for flood updates
 */
export function stopTrcaFloodsPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
