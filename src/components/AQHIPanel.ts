import { Panel } from "@/components/Panel";
import type { AQHIReading } from "@/services/eccc-aqhi";
import {
  getAQHIColor,
  getAQHICategory,
  getAQHISummary,
} from "@/services/eccc-aqhi";

interface AQHIData {
  readings: AQHIReading[];
  summary: {
    total: number;
    lowRisk: number;
    moderateRisk: number;
    highRisk: number;
    veryHighRisk: number;
    averageAQHI: number;
    maxAQHI: number;
    byStation: Record<string, AQHIReading>;
  };
  total: number;
  lastUpdated?: string;
}

export class AQHIPanel extends Panel {
  private data: AQHIData | null = null;

  constructor() {
    super("eccc-aqhi");
  }

  setData(data: AQHIData | null): void {
    this.data = data;
    this.render();
  }

  protected render(): void {
    const container = this.element;
    container.innerHTML = "";

    if (!this.data || this.data.readings.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <p>No air quality data available</p>
          <p class="panel-note">Data sourced from Environment and Climate Change Canada</p>
        </div>
      `;
      return;
    }

    const { readings, summary, total, lastUpdated } = this.data;

    // Format last updated timestamp
    const formattedLastUpdated = lastUpdated
      ? new Date(lastUpdated).toLocaleString('en-CA', {
          timeZone: 'America/Toronto',
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : 'Unknown';

    container.innerHTML = `
      <div class="panel-header">
        <h3 class="panel-title">Air Quality (AQHI)</h3>
        <div class="panel-badge">${total} stations</div>
      </div>

      <div class="panel-content">
        <div class="panel-section">
          <h4 class="panel-section-title">Current AQHI</h4>
          <div class="aqhi-display">
            <div class="aqhi-value" style="color: ${this.getAQHIColorHex(summary.averageAQHI)}">
              ${summary.averageAQHI}
            </div>
            <div class="aqhi-label">${getAQHICategory(summary.averageAQHI)}</div>
          </div>
        </div>

        <div class="panel-section">
          <h4 class="panel-section-title">Risk Levels</h4>
          <div class="risk-levels">
            ${this.renderRiskLevel(summary.lowRisk, total, "Low Risk", "green")}
            ${this.renderRiskLevel(summary.moderateRisk, total, "Moderate Risk", "yellow")}
            ${this.renderRiskLevel(summary.highRisk, total, "High Risk", "orange")}
            ${this.renderRiskLevel(summary.veryHighRisk, total, "Very High Risk", "red")}
          </div>
        </div>

        <div class="panel-section">
          <h4 class="panel-section-title">Stations</h4>
          <div class="station-list">
            ${Object.values(summary.byStation)
              .sort((a, b) => b.aqhi - a.aqhi)
              .map((station) => {
                const color = getAQHIColor(station.aqhi);
                return `
                  <div class="station-item">
                    <div class="station-header">
                      <span class="station-name">${station.stationName || station.stationId}</span>
                      <span class="station-aqhi" style="color: rgb(${color[0]}, ${color[1]}, ${color[2]});">
                        ${station.aqhi}
                      </span>
                    </div>
                    <div class="station-category">${getAQHICategory(station.aqhi)}</div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>

        <div class="panel-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <p class="panel-note" style="font-size: 11px; color: var(--text-dim); margin: 0;">
            Source: Environment and Climate Change Canada (ECCC) • Updated: ${formattedLastUpdated}
          </p>
        </div>
      </div>
    `;
  }

  private renderRiskLevel(
    count: number,
    total: number,
    label: string,
    level: string,
  ): string {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
    const colors: Record<string, string> = {
      green: "#22c55e",
      yellow: "#eab308",
      orange: "#f97316",
      red: "#ef4444",
    };

    return `
      <div class="risk-level-item">
        <div class="risk-level-header">
          <span class="risk-level-label">${label}</span>
          <span class="risk-level-count">${count}</span>
        </div>
        <div class="risk-level-bar">
          <div class="risk-level-bar-fill" style="width: ${percentage}%; background-color: ${colors[level]};"></div>
        </div>
      </div>
    `;
  }

  private getAQHIColorHex(aqhi: number): string {
    const color = getAQHIColor(aqhi);
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
}