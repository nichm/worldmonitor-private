/**
 * RavineProtectionPanel -- displays Toronto ravine & natural feature protection area stats
 * Shows area counts, total hectares, and breakdown by qualifier type
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { RavineProtectionArea, RavineProtectionSummary } from '@/config/ravine-protection';
import { summarizeRavineProtection } from '@/config/ravine-protection';

export class RavineProtectionPanel extends Panel {
  private areas: RavineProtectionArea[] = [];

  constructor() {
    super({
      id: 'ravine-protection',
      title: 'Ravine Protection',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto ravine and natural feature protection areas — bylaw-designated zones.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: RavineProtectionArea[] | null): void {
    if (data) {
      this.areas = data;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.areas || this.areas.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No ravine protection data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from City of Toronto Open Data (ArcGIS)</small>
      </div>`;
      return;
    }

    const summary: RavineProtectionSummary = summarizeRavineProtection(this.areas);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${summary.totalAreas.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Protection Areas</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#22c55e;">${summary.totalAreaHa.toFixed(0)} ha</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Area</div>
        </div>
      </div>
    `;

    // Breakdown by qualifier
    const qualifierEntries = Object.entries(summary.byQualifier)
      .sort((a, b) => b[1].areaHa - a[1].areaHa)
      .slice(0, 10);

    const qualifierHtml = qualifierEntries.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Qualifier</div>
        ${qualifierEntries.map(([qualifier, data]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:10px;height:10px;border-radius:2px;background:#22c55e;display:inline-block;"></span>
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(qualifier)}</span>
            </div>
            <div style="display:flex;gap:12px;font-size:12px;">
              <span style="color:var(--text-dim);">${data.count} areas</span>
              <span style="color:#22c55e;font-weight:600;">${data.areaHa.toFixed(1)} ha</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

    this.content.innerHTML = `
      ${summaryHtml}
      ${qualifierHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: City of Toronto Open Data (ArcGIS) — bylaw protection zones
      </small>
    `;
  }
}
