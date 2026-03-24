/**
 * CyclingNetworkPanel -- displays Toronto cycling network stats
 * Shows segment counts, infrastructure type breakdown, and total km by type
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { CyclingSegment, CyclingInfraType } from '@/config/cycling-network';
import { getCyclingInfraColor, summarizeCyclingNetwork, type CyclingNetworkSummary } from '@/config/cycling-network';

const INFRA_LABELS: Record<CyclingInfraType, string> = {
  cycle_track: 'Cycle Track',
  buffered_lane: 'Buffered Bike Lane',
  bike_lane: 'Bike Lane',
  sharrows: 'Shared Lane Markings',
  multi_use_path: 'Multi-Use Path',
  other: 'Other',
};

export class CyclingNetworkPanel extends Panel {
  private segments: CyclingSegment[] = [];

  constructor() {
    super({
      id: 'cycling-network',
      title: 'Cycling Network',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto bikeways — infrastructure type breakdown and total network length.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: CyclingSegment[] | null): void {
    if (data) {
      this.segments = data;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.segments || this.segments.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No cycling network data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from City of Toronto Open Data (ArcGIS)</small>
      </div>`;
      return;
    }

    const summary: CyclingNetworkSummary = summarizeCyclingNetwork(this.segments);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${summary.totalSegments.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Segments</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#22c55e;">${summary.totalLengthKm.toFixed(1)} km</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Length</div>
        </div>
      </div>
    `;

    // Infrastructure type breakdown
    const typeEntries = (Object.entries(summary.byInfraType) as [CyclingInfraType, { count: number; lengthKm: number }][])
      .filter(([, v]) => v.count > 0)
      .sort((a, b) => b[1].lengthKm - a[1].lengthKm);

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Infrastructure Type</div>
        ${typeEntries.map(([type, data]) => {
          const color = getCyclingInfraColor(type);
          const label = INFRA_LABELS[type] || type;
          const pct = summary.totalLengthKm > 0 ? ((data.lengthKm / summary.totalLengthKm) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>
                <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(label)}</span>
              </div>
              <div style="display:flex;gap:12px;font-size:12px;">
                <span style="color:var(--text-dim);">${data.count} segs</span>
                <span style="color:${color};font-weight:600;">${data.lengthKm.toFixed(1)} km (${pct}%)</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${typeHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: City of Toronto Open Data (ArcGIS) — refreshed weekly
      </small>
    `;
  }
}
