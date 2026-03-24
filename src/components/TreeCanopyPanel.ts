/**
 * TreeCanopyPanel -- displays Toronto urban forest canopy stats
 * Shows area counts, total hectares, canopy coverage, and breakdown by species
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { TreeCanopyArea, TreeCanopySummary } from '@/config/tree-canopy';
import { summarizeTreeCanopy } from '@/config/tree-canopy';

export class TreeCanopyPanel extends Panel {
  private areas: TreeCanopyArea[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'tree-canopy',
      title: 'Tree Canopy',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto urban forest canopy coverage — green space and tree distribution.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: TreeCanopyArea[] | null, lastUpdated?: string): void {
    if (data) {
      this.areas = data;
      this.lastUpdated = lastUpdated;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.areas || this.areas.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No tree canopy data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from City of Toronto Open Data (ArcGIS)</small>
      </div>`;
      return;
    }

    const summary: TreeCanopySummary = summarizeTreeCanopy(this.areas);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${summary.totalAreas.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Canopy Areas</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#22c55e;">${summary.totalAreaHa.toFixed(0)} ha</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Area</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#16a34a;">${summary.totalCanopyHa.toFixed(0)} ha</div>
          <div style="font-size:12px;color:var(--text-dim);">Canopy Coverage</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${summary.avgCanopyCoverPercent.toFixed(0)}%</div>
          <div style="font-size:12px;color:var(--text-dim);">Avg Coverage</div>
        </div>
      </div>
    `;

    // Breakdown by species
    const speciesEntries = Object.entries(summary.bySpecies)
      .sort((a, b) => b[1].canopyHa - a[1].canopyHa)
      .slice(0, 10);

    const speciesHtml = speciesEntries.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Tree Species</div>
        ${speciesEntries.map(([species, data]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:10px;height:10px;border-radius:2px;background:#22c55e;display:inline-block;"></span>
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(species)}</span>
            </div>
            <div style="display:flex;gap:12px;font-size:12px;">
              <span style="color:var(--text-dim);">${data.count} areas</span>
              <span style="color:#22c55e;font-weight:600;">${data.canopyHa.toFixed(1)} ha</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

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
      ${speciesHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: City of Toronto Open Data (ArcGIS) — urban forest canopy • Updated: ${escapeHtml(formattedLastUpdated)}
      </small>
    `;
  }
}