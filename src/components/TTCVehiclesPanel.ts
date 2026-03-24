import { formatDistanceToNow } from "date-fns";
import { escapeHtml } from "@/utils/sanitize";
import type { TTCVehicle } from "@/config/ttc-vehicles";

export class TTCVehiclesPanel {
  private container: HTMLElement;
  private vehicles: TTCVehicle[] = [];
  private lastUpdated?: string;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(vehicles: TTCVehicle[], lastUpdated?: string): void {
    this.vehicles = vehicles;
    this.lastUpdated = lastUpdated;

    // Format last updated timestamp
    const formattedLastUpdated = lastUpdated
      ? new Date(lastUpdated).toLocaleString('en-CA', {
          timeZone: 'America/Toronto',
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : 'Unknown';

    const html = `
      <div class="ttc-vehicles-panel">
        <div class="panel-header">
          <h3>TTC Vehicles</h3>
          <span class="vehicle-count">${vehicles.length} active</span>
        </div>
        <div class="vehicle-list">
          ${vehicles.slice(0, 30)
            .map(
              (v) => `
            <div class="vehicle-item" data-vehicle-id="${escapeHtml(v.id)}">
              <div class="vehicle-icon" style="color: ${this.getVehicleColor(v.routeId)}">
                ${v.routeType === "Streetcar" ? "🚋" : "🚌"}
              </div>
              <div class="vehicle-details">
                <div class="vehicle-route">Route ${escapeHtml(v.routeId)}</div>
                <div class="vehicle-type">${escapeHtml(v.routeType)}</div>
                <div class="vehicle-location">
                  ${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}
                </div>
                <div class="vehicle-bearing">Bearing: ${v.bearing}°</div>
                <div class="vehicle-timestamp">
                  ${this.formatTimestamp(v.timestamp)}
                </div>
              </div>
            </div>
          `,
            )
            .join("")}
          ${vehicles.length > 30 ? `<div style="text-align:center;padding:8px;color:var(--text-dim);font-size:12px;">+ ${vehicles.length - 30} more vehicles</div>` : ''}
        </div>
        <div class="panel-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <p class="panel-note" style="font-size: 11px; color: var(--text-dim); margin: 0;">
            Source: TTC NextBus API • Updated: ${escapeHtml(formattedLastUpdated)}
          </p>
        </div>
      </div>
    `;
    this.container.innerHTML = html;
  }

  showError(message: string): void {
    this.container.innerHTML = `
      <div class="ttc-vehicles-panel error">
        <div class="error-message">${escapeHtml(message)}</div>
        <p style="font-size:12px;color:var(--text-dim);margin:8px 0 0;">Data sourced from TTC NextBus API</p>
      </div>
    `;
  }

  showLoading(): void {
    this.container.innerHTML = `
      <div class="ttc-vehicles-panel loading">
        <div class="loading-spinner"></div>
        <div>Loading TTC vehicles...</div>
      </div>
    `;
  }

  private getVehicleColor(routeId: string): string {
    const colors: Record<string, string> = {
      "501": "#FF0000",
      "504": "#00FF00",
      "505": "#0000FF",
      "506": "#FFFF00",
      "509": "#FF00FF",
      "510": "#00FFFF",
      "512": "#FFA500",
    };
    return colors[routeId] || "#888888";
  }

  private formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return `Updated ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch {
      return "Unknown time";
    }
  }

  getVehicles(): TTCVehicle[] {
    return this.vehicles;
  }
}