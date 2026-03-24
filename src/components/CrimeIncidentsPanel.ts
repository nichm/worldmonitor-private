import { Panel } from "@/components/Panel";
import type { CrimeIncident } from "@/services/toronto-crime-incidents";
import { getCrimeIncidentColor, getCrimeIncidentSummary } from "@/services/toronto-crime-incidents";

interface CrimeIncidentsData {
  incidents: CrimeIncident[];
  summary: Record<string, number>;
  total: number;
  lastUpdated?: string;
}

export class CrimeIncidentsPanel extends Panel {
  private data: CrimeIncidentsData | null = null;

  constructor() {
    super("crime-incidents");
  }

  setData(data: CrimeIncidentsData | null): void {
    this.data = data;
    this.render();
  }

  protected render(): void {
    const container = this.element;
    container.innerHTML = "";

    if (!this.data || this.data.incidents.length === 0) {
      container.innerHTML = `
        <div class="panel-empty">
          <p>No crime incidents data available</p>
          <p class="panel-note">Data sourced from Toronto Police Service Open Data Portal</p>
        </div>
      `;
      return;
    }

    const { incidents, summary, total, lastUpdated } = this.data;

    // Format last updated timestamp
    const formattedLastUpdated = lastUpdated
      ? new Date(lastUpdated).toLocaleString('en-CA', {
          timeZone: 'America/Toronto',
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : 'Unknown';

    // Sort categories by count (descending)
    const sortedCategories = Object.entries(summary).sort(
      (a, b) => b[1] - a[1],
    );

    container.innerHTML = `
      <div class="panel-header">
        <h3 class="panel-title">Crime Incidents</h3>
        <div class="panel-badge">${total.toLocaleString()}</div>
      </div>

      <div class="panel-content">
        <div class="panel-section">
          <h4 class="panel-section-title">Total Incidents</h4>
          <div class="panel-stat-large">${total.toLocaleString()}</div>
        </div>

        <div class="panel-section">
          <h4 class="panel-section-title">By Category</h4>
          <div class="category-list">
            ${sortedCategories
              .map(([category, count]) => {
                const color = getCrimeIncidentColor(category);
                const percentage = ((count / total) * 100).toFixed(1);
                return `
                  <div class="category-item">
                    <div class="category-header">
                      <div class="category-dot" style="background-color: rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8);"></div>
                      <span class="category-name">${category}</span>
                      <span class="category-count">${count.toLocaleString()}</span>
                    </div>
                    <div class="category-bar">
                      <div class="category-bar-fill" style="width: ${percentage}%; background-color: rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6);"></div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>

        <div class="panel-section">
          <h4 class="panel-section-title">Notes</h4>
          <p class="panel-note">
            Points are deliberately offset for privacy. Data shows major crime indicators (MCI).
          </p>
        </div>

        <div class="panel-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <p class="panel-note" style="font-size: 11px; color: var(--text-dim); margin: 0;">
            Source: Toronto Police Service Open Data Portal • Updated: ${formattedLastUpdated}
          </p>
        </div>
      </div>
    `;
  }
}