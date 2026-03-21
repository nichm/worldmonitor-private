import { Panel } from "./Panel";
import { h, replaceChildren, safeHtml } from "@/utils/dom-utils";
import type { EcccAlert } from "@/services/eccc-alerts";
import {
  fetchEcccAlerts,
  classifyAlertSeverity,
  getEcccSeverityColor,
  getAlertTypes,
  getAlertLocations,
  type AlertSeverity,
} from "@/services/eccc-alerts";

export class EcccAlertsPanel extends Panel {
  private alerts: EcccAlert[] = [];
  private filteredAlerts: EcccAlert[] = [];
  private selectedType = "all";
  private selectedSeverity: AlertSeverity | "all" = "all";
  private selectedLocation = "all";
  private typeFilterEl: HTMLElement | null = null;
  private severityFilterEl: HTMLElement | null = null;
  private locationFilterEl: HTMLElement | null = null;
  private loading = false;
  private lastFetch = 0;
  private typeButtons: Map<string, HTMLElement> = new Map();
  private locationButtons: Map<string, HTMLElement> = new Map();

  constructor() {
    super({
      id: "eccc-alerts",
      title: "ECCC Weather Alerts",
      showCount: true,
      trackActivity: true,
      infoTooltip:
        "Environment Canada weather alerts for Ontario. Shows warnings, watches, and advisories for severe weather conditions.",
      defaultRowSpan: 2,
    });

    this.createFilters();
    this.showLoading("Loading alerts...");
  }

  private createFilters(): void {
    const filterContainer = h("div", { className: "eccc-alerts-filters" });

    // Severity filter
    this.severityFilterEl = h(
      "div",
      { className: "eccc-alerts-filter-group" },
      h("label", { className: "eccc-alerts-filter-label" }, "Severity:"),
      this.createSeverityButtons(),
    );

    // Alert type filter
    this.typeFilterEl = h(
      "div",
      { className: "eccc-alerts-filter-group" },
      h("label", { className: "eccc-alerts-filter-label" }, "Type:"),
      h(
        "div",
        { className: "eccc-alerts-type-buttons" },
        h(
          "button",
          {
            className: "eccc-alerts-type-btn active",
            dataset: { type: "all" },
            onClick: () => this.selectType("all"),
          },
          "All",
        ),
      ),
    );

    // Location filter
    this.locationFilterEl = h(
      "div",
      { className: "eccc-alerts-filter-group" },
      h("label", { className: "eccc-alerts-filter-label" }, "Location:"),
      h(
        "div",
        { className: "eccc-alerts-location-buttons" },
        h(
          "button",
          {
            className: "eccc-alerts-location-btn active",
            dataset: { location: "all" },
            onClick: () => this.selectLocation("all"),
          },
          "All",
        ),
      ),
    );

    filterContainer.appendChild(this.severityFilterEl);
    filterContainer.appendChild(this.typeFilterEl);
    filterContainer.appendChild(this.locationFilterEl);
    this.element.insertBefore(filterContainer, this.content);
  }

  private createSeverityButtons(): HTMLElement {
    const container = h("div", { className: "eccc-alerts-severity-buttons" });

    const severities: Array<AlertSeverity | "all"> = [
      "all",
      "Warning",
      "Watch",
      "Advisory",
      "Statement",
    ];

    for (const severity of severities) {
      const label = severity === "all" ? "All" : severity;
      const button = h(
        "button",
        {
          className: `eccc-alerts-severity-btn ${severity === "all" ? "active" : ""}`,
          dataset: { severity },
          onClick: () => this.selectSeverity(severity),
        },
        label,
      );

      if (severity !== "all") {
        const color = getEcccSeverityColor(severity);
        // Add a small color indicator
        const indicator = h("span", {
          className: "severity-indicator",
          style: `background-color: rgb(${color.join(",")})`,
        });
        button.appendChild(indicator);
      }

      container.appendChild(button);
    }

    return container;
  }

  private selectSeverity(severity: AlertSeverity | "all"): void {
    if (this.selectedSeverity === severity) return;

    this.selectedSeverity = severity;
    this.severityFilterEl
      ?.querySelectorAll(".eccc-alerts-severity-btn")
      .forEach((btn) => {
        const btnEl = btn as HTMLElement;
        btnEl.classList.toggle("active", btnEl.dataset.severity === severity);
      });

    this.applyFilters();
  }

  private selectType(type: string): void {
    if (this.selectedType === type) return;

    this.selectedType = type;
    this.typeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === type);
    });

    this.applyFilters();
  }

  private selectLocation(location: string): void {
    if (this.selectedLocation === location) return;

    this.selectedLocation = location;
    this.locationButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.location === location);
    });

    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredAlerts = this.alerts.filter((alert) => {
      // Filter by severity
      if (this.selectedSeverity !== "all") {
        const alertSeverity = classifyAlertSeverity(alert);
        if (alertSeverity !== this.selectedSeverity) {
          return false;
        }
      }

      // Filter by type
      if (
        this.selectedType !== "all" &&
        alert.threat.category !== this.selectedType
      ) {
        return false;
      }

      // Filter by location
      if (
        this.selectedLocation !== "all" &&
        alert.locationName !== this.selectedLocation
      ) {
        return false;
      }

      return true;
    });

    this.setCount(this.filteredAlerts.length);
    this.renderAlerts();
  }

  private updateTypeButtons(): void {
    const types = getAlertTypes(this.alerts);
    const container = this.typeFilterEl?.querySelector(
      ".eccc-alerts-type-buttons",
    );

    if (!container) return;

    this.typeButtons.clear();
    replaceChildren(
      container,
      h(
        "button",
        {
          className: `eccc-alerts-type-btn ${this.selectedType === "all" ? "active" : ""}`,
          dataset: { type: "all" },
          onClick: () => this.selectType("all"),
        },
        "All",
      ),
      ...types.map((type) => {
        const button = h(
          "button",
          {
            className: `eccc-alerts-type-btn ${this.selectedType === type ? "active" : ""}`,
            dataset: { type },
            onClick: () => this.selectType(type),
          },
          type,
        );
        this.typeButtons.set(type, button);
        return button;
      }),
    );
  }

  private updateLocationButtons(): void {
    const locations = getAlertLocations(this.alerts);
    const container = this.locationFilterEl?.querySelector(
      ".eccc-alerts-location-buttons",
    );

    if (!container) return;

    this.locationButtons.clear();
    replaceChildren(
      container,
      h(
        "button",
        {
          className: `eccc-alerts-location-btn ${this.selectedLocation === "all" ? "active" : ""}`,
          dataset: { location: "all" },
          onClick: () => this.selectLocation("all"),
        },
        "All",
      ),
      ...locations.map((location) => {
        // Truncate long location names
        const label =
          location.length > 25 ? location.slice(0, 22) + "..." : location;
        const button = h(
          "button",
          {
            className: `eccc-alerts-location-btn ${this.selectedLocation === location ? "active" : ""}`,
            dataset: { location },
            onClick: () => this.selectLocation(location),
            title: location, // Show full name on hover
          },
          label,
        );
        this.locationButtons.set(location, button);
        return button;
      }),
    );
  }

  public setData(alerts: EcccAlert[]): void {
    this.alerts = alerts;
    this.updateTypeButtons();
    this.updateLocationButtons();
    this.applyFilters();
  }

  private renderAlerts(): void {
    if (this.filteredAlerts.length === 0) {
      replaceChildren(
        this.content,
        h(
          "div",
          { className: "empty-state" },
          this.alerts.length === 0
            ? h("p", {}, "No active weather alerts")
            : h("p", {}, "No alerts match filters"),
        ),
      );
      return;
    }

    // Sort by severity (Warning first) then by time
    const sorted = [...this.filteredAlerts].sort((a, b) => {
      const severityOrder = {
        Warning: 0,
        Watch: 1,
        Advisory: 2,
        Statement: 3,
        Other: 4,
      };
      const aSeverity = classifyAlertSeverity(a);
      const bSeverity = classifyAlertSeverity(b);

      if (aSeverity !== bSeverity) {
        return severityOrder[aSeverity] - severityOrder[bSeverity];
      }

      return b.pubDate.getTime() - a.pubDate.getTime();
    });

    replaceChildren(
      this.content,
      h(
        "div",
        { className: "eccc-alerts-list" },
        ...sorted.map((alert) => this.buildAlertItem(alert)),
      ),
    );
  }

  private buildAlertItem(alert: EcccAlert): HTMLElement {
    const severity = classifyAlertSeverity(alert);
    const color = getEcccSeverityColor(severity);
    const colorClass = `severity-${severity.toLowerCase()}`;

    return h(
      "div",
      { className: `eccc-alert-item ${colorClass}` },
      h(
        "div",
        { className: "eccc-alert-header" },
        h(
          "div",
          { className: "eccc-alert-severity" },
          h(
            "span",
            {
              className: "eccc-alert-severity-badge",
              style: `background-color: rgb(${color.join(",")})`,
            },
            severity,
          ),
        ),
        h(
          "div",
          { className: "eccc-alert-time" },
          this.formatTime(alert.pubDate),
        ),
        h("div", { className: "eccc-alert-event" }, alert.threat.category),
      ),
      h("div", { className: "eccc-alert-title" }, alert.title),
      h("div", { className: "eccc-alert-location" }, alert.locationName),
      alert.description
        ? h(
            "div",
            { className: "eccc-alert-description" },
            safeHtml(
              alert.description.slice(0, 200) +
                (alert.description.length > 200 ? "..." : ""),
            ),
          )
        : null,
    );
  }

  private formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  }

  public async refresh(): Promise<void> {
    if (this.loading) return;

    const now = Date.now();
    // Only refresh if 5 minutes have passed
    if (now - this.lastFetch < 5 * 60 * 1000) {
      return;
    }

    this.loading = true;
    this.showLoading("Refreshing...");

    try {
      const alerts = await fetchEcccAlerts();
      this.lastFetch = now;
      this.setData(alerts);
    } catch (error) {
      console.error("[ECCC Alerts] Refresh failed:", error);
      replaceChildren(
        this.content,
        h(
          "div",
          { className: "empty-state error" },
          h("p", {}, "Failed to load alerts"),
          h("p", { className: "error-message" }, (error as Error).message),
        ),
      );
    } finally {
      this.loading = false;
    }
  }

  public destroy(): void {
    this.typeButtons.clear();
    this.locationButtons.clear();
    super.destroy();
  }
}
