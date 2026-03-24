/**
 * GreenPParkingPanel -- displays Green P Parking lots data
 * Shows total lots, capacity, rate information, and distribution by type
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { GreenPParkingLot, GreenPParkingSummary } from '@/config/green-p-parking';
import { summarizeGreenPParking } from '@/config/green-p-parking';

export class GreenPParkingPanel extends Panel {
  private lots: GreenPParkingLot[] = [];
  private summary?: GreenPParkingSummary;

  constructor() {
    super({
      id: 'green-p-parking',
      title: 'Green P Parking',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'City of Toronto Green P parking lots with capacity and rate information (2019 snapshot).',
    });
    this.showLoading('Loading...');
  }

  public setData(lots: GreenPParkingLot[] | null): void {
    if (lots) {
      this.lots = lots;
      this.summary = summarizeGreenPParking(lots);
      this.setCount(lots.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.lots || this.lots.length === 0 || !this.summary) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No Green P parking data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from City of Toronto Open Data Portal (2019 snapshot)</small>
      </div>`;
      return;
    }

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${this.summary.totalLots.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Lots</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#10b981;">${this.summary.totalCapacity.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Capacity</div>
        </div>
      </div>
    `;

    const rateHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Rate Information</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
          <span style="font-size:13px;color:var(--text);font-weight:500;">Avg 1-Hour Rate</span>
          <div style="font-size:12px;color:var(--text);font-weight:600;">$${this.summary.avgRate1Hr.toFixed(2)}</div>
        </div>
      </div>
    `;

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Type</div>
        ${Object.entries(this.summary.byType)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8) // Show top 8
          .map(([type, count]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(type)}</span>
              <div style="font-size:12px;color:var(--text);font-weight:600;">${count.toLocaleString()}</div>
            </div>
          `).join('')}
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${rateHtml}
      ${typeHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: City of Toronto Open Data Portal (2019 snapshot) • Use parking.greenp.com for live availability
      </small>
    `;
  }
}