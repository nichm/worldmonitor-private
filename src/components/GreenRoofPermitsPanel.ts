/**
 * GreenRoofPermitsPanel -- displays Toronto green roof permits stats
 * Shows total permits, total green roof area, by permit type, and by year
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { GreenRoofPermit } from '@/config/green-roof-permits';
import { getPermitTypeColor, getBylawNotice } from '@/config/green-roof-permits';

export class GreenRoofPermitsPanel extends Panel {
  private permits: GreenRoofPermit[] = [];

  constructor() {
    super({
      id: 'green-roof-permits',
      title: 'Green Roof Permits',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Green roof construction permits in Toronto — bylaw and voluntary applications.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: { permits: GreenRoofPermit[]; total: number; totalAreaSqm: number; byPermitType: Record<string, number>; byYear: Record<string, number> } | null): void {
    if (data) {
      this.permits = data.permits;
      this.setCount(data.total);
      this.renderContent(data);
    }
  }

  private renderContent(data: { permits: GreenRoofPermit[]; total: number; totalAreaSqm: number; byPermitType: Record<string, number>; byYear: Record<string, number> }): void {
    if (!data || !data.permits || data.permits.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No permit data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto Open Data</small>
      </div>`;
      return;
    }

    const { total, totalAreaSqm, byPermitType, byYear } = data;

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${total.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Permits</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#22c55e;">${(totalAreaSqm / 1000).toFixed(1)}k m²</div>
          <div style="font-size:12px;color:var(--text-dim);">Green Roof Area</div>
        </div>
      </div>
    `;

    // Permit type breakdown
    const typeEntries = Object.entries(byPermitType)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Permit Type</div>
        ${typeEntries.map(([permitType, count]) => {
          const color = getPermitTypeColor(permitType);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>
                <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(permitType.replace(/_/g, ' '))}</span>
              </div>
              <div style="display:flex;gap:12px;font-size:12px;">
                <span style="color:var(--text-dim);">${count} permits</span>
                <span style="color:${color};font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Year breakdown (recent years first, max 6)
    const yearEntries = Object.entries(byYear)
      .filter(([, count]) => count > 0)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .slice(0, 6);

    const yearHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Year</div>
        ${yearEntries.map(([year, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);">${escapeHtml(year)}</span>
              <div style="display:flex;gap:8px;font-size:12px;">
                <span style="color:var(--text-dim);">${count}</span>
                <span style="color:var(--text);font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bylaw notice
    const bylawNoticeHtml = `
      <div style="margin:12px 0;padding:8px;background:#f0fdf4;border:1px solid #22c55e;border-radius:6px;">
        <p style="margin:0;font-size:12px;color:#166534;">${escapeHtml(getBylawNotice())}</p>
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${typeHtml}
      ${yearHtml}
      ${bylawNoticeHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:8px 0 4px;font-size:11px;">
        Source: City of Toronto Open Data — refreshed weekly
      </small>
    `;
  }
}