/**
 * BikeSharePanel -- displays Toronto Bike Share station stats
 * Shows total stations, bikes available, empty stations, and station health
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { BikeShareStation, BikeShareSummary } from '@/config/bike-share';
import { summarizeBikeShare } from '@/config/bike-share';

export class BikeSharePanel extends Panel {
  private stations: BikeShareStation[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'bike-share',
      title: 'Bike Share',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto Bike Share (PBSC) station availability and status.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: BikeShareStation[] | null, lastUpdated?: string): void {
    if (data) {
      this.stations = data;
      this.lastUpdated = lastUpdated;
      this.setCount(data.filter(s => s.isInstalled).length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.stations || this.stations.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No bike share data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto Bike Share GBFS</small>
      </div>`;
      return;
    }

    const summary: BikeShareSummary = summarizeBikeShare(this.stations);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${summary.activeStations.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Active Stations</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#22c55e;">${summary.totalBikesAvailable.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Bikes Available</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${summary.avgAvailabilityPercent.toFixed(0)}%</div>
          <div style="font-size:12px;color:var(--text-dim);">Avg Availability</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#f59e0b;">${summary.healthyStations.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Healthy Stations</div>
        </div>
      </div>
    `;

    const healthHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Station Health</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:10px;height:10px;border-radius:2px;background:#ef4444;display:inline-block;"></span>
            <span style="font-size:13px;color:var(--text);font-weight:500;">Empty (0 bikes)</span>
          </div>
          <div style="font-size:12px;color:#ef4444;font-weight:600;">${summary.emptyStations.toLocaleString()}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:10px;height:10px;border-radius:2px;background:#22c55e;display:inline-block;"></span>
            <span style="font-size:13px;color:var(--text);font-weight:500;">Healthy (25-75%)</span>
          </div>
          <div style="font-size:12px;color:#22c55e;font-weight:600;">${summary.healthyStations.toLocaleString()}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:10px;height:10px;border-radius:2px;background:#f59e0b;display:inline-block;"></span>
            <span style="font-size:13px;color:var(--text);font-weight:500;">Full (0 docks)</span>
          </div>
          <div style="font-size:12px;color:#f59e0b;font-weight:600;">${summary.fullStations.toLocaleString()}</div>
        </div>
      </div>
    `;

    const capacityHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Network Capacity</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
          <span style="font-size:13px;color:var(--text);">Total Capacity</span>
          <span style="font-size:12px;color:var(--text);font-weight:600;">${summary.totalCapacity.toLocaleString()} bikes</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
          <span style="font-size:13px;color:var(--text);">Empty Docks</span>
          <span style="font-size:12px;color:var(--text);font-weight:600;">${summary.totalDocksAvailable.toLocaleString()} docks</span>
        </div>
      </div>
    `;

    // Format last updated timestamp
    const formattedLastUpdated = this.lastUpdated
      ? new Date(this.lastUpdated).toLocaleString('en-CA', {
          timeZone: 'America/Toronto',
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : 'Unknown';

    this.content.innerHTML = `
      ${summaryHtml}
      ${healthHtml}
      ${capacityHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto Bike Share (PBSC Urban Solutions) GBFS v2.3 • Updated: ${escapeHtml(formattedLastUpdated)}
      </small>
    `;
  }
}