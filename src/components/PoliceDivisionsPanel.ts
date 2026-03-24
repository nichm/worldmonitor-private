/**
 * PoliceDivisionsPanel -- displays Toronto Police Service divisions
 * Shows total divisions and geographic coverage
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { PoliceDivision } from '@/config/police-divisions';

export class PoliceDivisionsPanel extends Panel {
  private divisions: PoliceDivision[] = [];

  constructor() {
    super({
      id: 'police-divisions',
      title: 'Police Divisions',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto Police Service geographic divisions covering the city.',
    });
    this.showLoading('Loading...');
  }

  public setData(divisions: PoliceDivision[] | null): void {
    if (divisions) {
      this.divisions = divisions;
      this.setCount(divisions.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.divisions || this.divisions.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No police divisions data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto Police Service ArcGIS FeatureServer</small>
      </div>`;
      return;
    }

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${this.divisions.length.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Divisions</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#3b82f6;">City-wide</div>
          <div style="font-size:12px;color:var(--text-dim);">Coverage</div>
        </div>
      </div>
    `;

    const divisionsHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Divisions</div>
        <div style="max-height:300px;overflow-y:auto;">
          ${this.divisions
            .sort((a, b) => a.division.localeCompare(b.division, undefined, { numeric: true }))
            .slice(0, 20) // Show first 20
            .map((div) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
                <span style="font-size:13px;color:var(--text);font-weight:500;">Division ${escapeHtml(div.division)}</span>
                <span style="font-size:12px;color:var(--text-dim);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(div.divisionName)}</span>
              </div>
            `).join('')}
        </div>
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${divisionsHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto Police Service ArcGIS FeatureServer
      </small>
    `;
  }
}