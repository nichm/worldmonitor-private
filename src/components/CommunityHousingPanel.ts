/**
 * CommunityHousingPanel -- displays Toronto Community Housing building stats
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { CommunityHousingBuilding, CommunityHousingSummary } from '@/config/community-housing';
import { summarizeCommunityHousing } from '@/config/community-housing';
import { t } from '@/services/i18n';

export class CommunityHousingPanel extends Panel {
  private data: CommunityHousingBuilding[] = [];

  constructor() {
    super({
      id: 'community-housing',
      title: 'Community Housing',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto Community Housing buildings — unit counts, building types, and top developments.',
    });
    this.showLoading(t('common.loading'));
  }

  public setData(data: CommunityHousingBuilding[]): void {
    this.data = data;
    this.setCount(data.length);
    this.renderContent();
  }

  private renderContent(): void {
    if (!this.data || this.data.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No community housing data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from City of Toronto Open Data Portal</small>
      </div>`;
      return;
    }

    const summary = summarizeCommunityHousing(this.data);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${summary.totalBuildings.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Buildings</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#2563eb;">${summary.totalUnits.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Units</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#16a34a;">${summary.totalRgiUnits.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">RGI Units</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text-dim);">${summary.totalMarketUnits.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Market Units</div>
        </div>
      </div>
    `;

    // Building type breakdown
    const formEntries = Object.entries(summary.byBuildingForm)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const formHtml = formEntries.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Building Type</div>
        ${formEntries.map(([form, count]) => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-color,rgba(255,255,255,0.06));font-size:13px;">
            <span style="color:var(--text);">${escapeHtml(form)}</span>
            <span style="color:var(--text-dim);font-weight:500;">${count}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    // Police division breakdown
    const divEntries = Object.entries(summary.byPoliceDivision)
      .sort((a, b) => Number(a[0]) - Number(b[0]));
    const divHtml = divEntries.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Police Division</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${divEntries.map(([div, count]) => `
            <span style="background:var(--bg-elevated);border-radius:4px;padding:3px 8px;font-size:12px;color:var(--text-dim);">
              Div ${div}: <strong style="color:var(--text);">${count}</strong>
            </span>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Top 10 developments
    const topHtml = summary.topDevelopments.length > 0 ? `
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Top 10 Developments (by units)</div>
        ${summary.topDevelopments.map((dev, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;color:var(--text-dim);width:16px;">${i + 1}.</span>
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(dev.name)}</span>
            </div>
            <div style="display:flex;gap:12px;font-size:12px;">
              <span style="color:var(--text-dim);">${dev.buildings} bldgs</span>
              <span style="color:#2563eb;font-weight:600;">${dev.units.toLocaleString()} units</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

    this.content.innerHTML = `
      ${summaryHtml}
      ${formHtml}
      ${divHtml}
      ${topHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: City of Toronto Open Data Portal
      </small>
    `;
  }
}
