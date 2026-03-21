import { Panel } from "./Panel";
import { escapeHtml } from "@/utils/sanitize";
import { formatTime } from "@/utils";
import type { TrcaFloodMessage } from "@/services/trca-floods";
import {
  fetchTrcaFloods,
  onTrcaFloodsUpdate,
  startTrcaFloodsPolling,
  stopTrcaFloodsPolling,
} from "@/services/trca-floods";

const SEVERITY_COLORS: Record<string, string> = {
  "FLOOD WARNING": "var(--threat-critical)",
  "FLOOD WATCH": "var(--threat-high)",
  "WATER SAFETY STATEMENT": "var(--threat-medium)",
  "WATERSHED CONDITIONS STATEMENT": "var(--threat-low)",
  NORMAL: "var(--text-dim)",
};

type MessageFilter = "all" | "warning" | "watch" | "safety" | "statement";

export class TrcaFloodsPanel extends Panel {
  private messages: TrcaFloodMessage[] = [];
  private filter: MessageFilter = "all";
  private filterSelect: HTMLElement | null = null;

  constructor() {
    super({
      id: "trca-floods",
      title: "TRCA Flood Status",
      showCount: true,
      trackActivity: true,
      infoTooltip:
        "Flood messaging from Toronto and Region Conservation Authority (TRCA). Monitors watershed conditions and issues flood warnings for the Toronto region.",
      defaultRowSpan: 1,
    });

    this.showLoading("Loading flood status...");
    this.setupEventListeners();
    this.loadData();
  }

  private setupEventListeners(): void {
    onTrcaFloodsUpdate((data) => {
      this.messages = data;
      this.render();
    });

    startTrcaFloodsPolling();
  }

  private async loadData(): Promise<void> {
    try {
      const data = await fetchTrcaFloods();
      this.messages = data;
      this.render();
    } catch (error) {
      console.error("[TrcaFloodsPanel] Failed to load data:", error);
      this.showError("Failed to load flood status", () => this.loadData());
    }
  }

  private createFilterControls(): string {
    const filters: Array<{ value: MessageFilter; label: string }> = [
      { value: "all", label: "All Messages" },
      { value: "warning", label: "Flood Warning" },
      { value: "watch", label: "Flood Watch" },
      { value: "safety", label: "Water Safety" },
      { value: "statement", label: "Watershed Statement" },
    ];

    return `
      <div class="trca-floods-filters">
        <div class="filter-group">
          <label>Filter:</label>
          <select class="message-filter" data-filter="message">
            ${filters
              .map(
                (f) => `
              <option value="${f.value}" ${this.filter === f.value ? "selected" : ""}>${f.label}</option>
            `,
              )
              .join("")}
          </select>
        </div>
      </div>
    `;
  }

  private bindFilterEvents(): void {
    if (!this.filterSelect) return;

    const select = this.filterSelect.querySelector(
      ".message-filter",
    ) as HTMLSelectElement;

    if (select) {
      select.addEventListener("change", () => {
        this.filter = select.value as MessageFilter;
        this.render();
      });
    }
  }

  private getFilterForMessage(message: TrcaFloodMessage): MessageFilter | null {
    const type = message.messageType?.toUpperCase() || "";

    if (type.includes("FLOOD WARNING")) return "warning";
    if (type.includes("FLOOD WATCH")) return "watch";
    if (type.includes("WATER SAFETY")) return "safety";
    if (type.includes("WATERSHED CONDITIONS")) return "statement";

    return null;
  }

  private filterMessages(): TrcaFloodMessage[] {
    if (this.filter === "all") return this.messages;

    return this.messages.filter((msg) => {
      const msgFilter = this.getFilterForMessage(msg);
      return msgFilter === this.filter;
    });
  }

  private getSeverityColor(messageType: string): string {
    const type = messageType?.toUpperCase() || "";
    for (const [key, color] of Object.entries(SEVERITY_COLORS)) {
      if (type.includes(key)) return color;
    }
    return SEVERITY_COLORS["NORMAL"] || "var(--text-dim)";
  }

  private getSeverityBadge(messageType: string): string {
    const type = messageType?.toUpperCase() || "";
    if (type.includes("FLOOD WARNING")) return "critical";
    if (type.includes("FLOOD WATCH")) return "warning";
    if (type.includes("WATER SAFETY")) return "safety";
    if (type.includes("WATERSHED CONDITIONS")) return "statement";
    return "normal";
  }

  private formatTimeSince(pubDate: string | Date): string {
    if (!pubDate) return "";
    const date = typeof pubDate === "string" ? new Date(pubDate) : pubDate;
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) return "just now";
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private renderMessage(message: TrcaFloodMessage): string {
    const severityColor = this.getSeverityColor(message.messageType || "");
    const severityBadge = this.getSeverityBadge(message.messageType || "");
    const timeSince = this.formatTimeSince(message.pubDate);

    return `
      <div class="trca-flood-message" data-severity="${severityBadge}">
        <div class="message-header">
          <span class="message-type" style="color: ${severityColor}">${escapeHtml(message.messageType || "Message")}</span>
          <span class="message-time">${timeSince}</span>
        </div>
        <div class="message-title">${escapeHtml(message.title)}</div>
        ${
          message.affectedAreas && message.affectedAreas.length > 0
            ? `
          <div class="message-areas">
            Areas: ${message.affectedAreas.map((a) => escapeHtml(a)).join(", ")}
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  private renderWaterStatus(status: string): string {
    const isNormal = status?.toLowerCase().includes("normal");
    return `
      <div class="trca-water-status ${isNormal ? "status-normal" : "status-alert"}">
        <div class="status-icon">${isNormal ? "✓" : "⚠"}</div>
        <div class="status-text">${escapeHtml(status || "Unknown")}</div>
      </div>
    `;
  }

  private render(): void {
    const filtered = this.filterMessages();
    this.setCount(filtered.length);

    // Check if there are any active warnings or watches
    const hasActiveAlert = this.messages.some((msg) => {
      const type = msg.messageType?.toUpperCase() || "";
      return type.includes("FLOOD WARNING") || type.includes("FLOOD WATCH");
    });

    const riversStatus = this.messages.find(
      (msg) =>
        msg.category === "water_status" &&
        msg.affectedAreas?.includes("Rivers"),
    )?.title;
    const shorelineStatus = this.messages.find(
      (msg) =>
        msg.category === "water_status" &&
        msg.affectedAreas?.includes("Shoreline"),
    )?.title;

    const html = `
      ${this.createFilterControls()}
      <div class="trca-floods-content">
        ${
          riversStatus
            ? `
          <div class="trca-flood-watershed-status">
            <div class="watershed-title">Rivers & Streams</div>
            ${this.renderWaterStatus(riversStatus)}
          </div>
        `
            : ""
        }
        ${
          shorelineStatus
            ? `
          <div class="trca-flood-watershed-status">
            <div class="watershed-title">Lake Ontario Shoreline</div>
            ${this.renderWaterStatus(shorelineStatus)}
          </div>
        `
            : ""
        }

        ${
          hasActiveAlert
            ? `
          <div class="trca-flood-alert-banner">
            <span class="alert-icon">⚠</span>
            <span class="alert-text">Active flood alerts in effect</span>
          </div>
        `
            : ""
        }

        ${
          filtered.length === 0
            ? `
          <div class="panel-empty">
            ${this.filter === "all" ? "No flood messages" : "No messages match current filter"}
          </div>
        `
            : `
          <div class="trca-floods-messages">
            ${filtered.map((msg) => this.renderMessage(msg)).join("")}
          </div>
        `
        }
      </div>
      <div class="panel-footer">
        <span class="panel-source">TRCA</span>
        <span class="panel-updated">Updated ${formatTime(new Date())}</span>
      </div>
    `;

    this.setContent(html);
    this.filterSelect = this.content.querySelector(".trca-floods-filters");
    this.bindFilterEvents();
  }

  public override destroy(): void {
    stopTrcaFloodsPolling();
    super.destroy();
  }
}
