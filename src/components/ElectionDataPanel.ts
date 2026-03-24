/**
 * ElectionDataPanel -- displays Toronto polling stations and electoral boundaries
 * Shows total stations, by electoral district, and accessibility info
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { PollingStation } from '@/services/election-data';

export class ElectionDataPanel extends Panel {
  private stations: PollingStation[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'election-data',
      title: 'Election Polling Stations',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto polling stations and electoral boundaries — accessibility and ward information.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: { pollingStations: PollingStation[]; total: number; byDistrict: Record<string, number>; accessibleCount: number } | null, lastUpdated?: string): void {
    if (data) {
      this.stations = data.pollingStations;
      this.lastUpdated = lastUpdated;
      this.setCount(data.total);
      this.renderContent(data);
    }
  }

  private renderContent(data: { pollingStations: PollingStation[]; total: number; byDistrict: Record<string, number>; accessibleCount: number }): void {
    if (!data || !data.pollingStations || data.pollingStations.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No election data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Elections Canada</small>
      </div>`;
      return;
    }

    const { total, byDistrict, accessibleCount } = data;
    const accessibilityRate = total > 0 ? ((accessibleCount / total) * 100).toFixed(1) : '0';

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${total.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Stations</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#10b981;">${Object.keys(byDistrict).length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Electoral Districts</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#3b82f6;">${accessibilityRate}%</div>
          <div style="font-size:12px;color:var(--text-dim);">Accessible</div>
        </div>
      </div>
    `;

    // Electoral district breakdown
    const districtEntries = Object.entries(byDistrict)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const districtHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Electoral District</div>
        ${districtEntries.map(([district, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(district)}</span>
              <div style="display:flex;gap:12px;font-size:12px;">
                <span style="color:var(--text-dim);">${count} stations</span>
                <span style="color:#10b981;font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Accessibility breakdown
    const accessibleHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Accessibility</div>
        <div style="display:flex;gap:12px;">
          <div style="flex:1;padding:12px;background:var(--bg-elevated);border-radius:6px;text-align:center;">
            <div style="font-size:24px;font-weight:600;color:#10b981;">${accessibleCount}</div>
            <div style="font-size:12px;color:var(--text-dim);">Full Access</div>
          </div>
          <div style="flex:1;padding:12px;background:var(--bg-elevated);border-radius:6px;text-align:center;">
            <div style="font-size:24px;font-weight:600;color:#f59e0b;">${total - accessibleCount}</div>
            <div style="font-size:12px;color:var(--text-dim);">Limited Access</div>
          </div>
        </div>
      </div>
    `;

    // Top stations by name (max 5)
    const topStations = data.pollingStations
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 5);

    const stationsHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Stations (A-Z)</div>
        ${topStations.map(station => `
          <div style="display:flex;align-items:center;padding:6px 8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${station.accessibility ? '#10b981' : '#f59e0b'};display:inline-block;margin-right:8px;"></span>
            <span style="flex:1;font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(station.name)}</span>
            <span style="font-size:11px;color:var(--text-dim);">Ward ${escapeHtml(station.ward)}</span>
          </div>
        `).join('')}
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
      ${districtHtml}
      ${accessibleHtml}
      ${stationsHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Elections Canada • Updated: ${escapeHtml(formattedLastUpdated)}
      </small>
    `;
  }
}