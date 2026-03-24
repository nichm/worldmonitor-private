/**
 * WardBoundariesPanel -- displays Toronto ward boundaries
 * Shows ward count and list
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { WardBoundary } from '@/config/ward-boundaries';

export class WardBoundariesPanel extends Panel {
  private wards: WardBoundary[] = [];

  constructor() {
    super({
      id: 'ward-boundaries',
      title: 'Council Ward Boundaries',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto City Council ward boundaries (25 wards).',
    });
    this.showLoading('Loading...');
  }

  public setData(data: WardBoundary[] | null): void {
    if (data) {
      this.wards = data;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.wards || this.wards.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No ward boundary data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto CKAN</small>
      </div>`;
      return;
    }

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(1,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${this.wards.length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Wards</div>
        </div>
      </div>
    `;

    // Ward list (sorted by number)
    const sortedWards = [...this.wards].sort((a, b) => a.number - b.number);

    const wardListHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Wards</div>
        ${sortedWards.map((ward) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:24px;height:24px;border-radius:4px;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;">${ward.number}</span>
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(ward.name)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${wardListHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto CKAN — refreshed daily
      </small>
      <small style="display:block;text-align:center;color:var(--text-dim);padding:0 0 4px;font-size:10px;">
        TODO: Add council voting records data source
      </small>
    `;
  }
}