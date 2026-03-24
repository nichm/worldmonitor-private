/**
 * MLSInvestigationsPanel -- displays Municipal Licensing & Standards investigation activity
 * Shows investigation counts by type and status
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { MLSInvestigation } from '@/config/mls-investigations';

export class MLSInvestigationsPanel extends Panel {
  private investigations: MLSInvestigation[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'mls-investigations',
      title: 'ML&S Investigations',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Municipal Licensing & Standards investigation locations by type and status.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: MLSInvestigation[] | null, lastUpdated?: string): void {
    if (data) {
      this.investigations = data;
      this.lastUpdated = lastUpdated;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.investigations || this.investigations.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No ML&S investigation data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto CKAN</small>
      </div>`;
      return;
    }

    // Count by type and status
    const byType = this.investigations.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = this.investigations.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${this.investigations.length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Investigations</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#f59e0b;">${byStatus['Active'] || 0}</div>
          <div style="font-size:12px;color:var(--text-dim);">Active Cases</div>
        </div>
      </div>
    `;

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Investigation Type</div>
        ${typeEntries.map(([type, count]) => {
          const pct = ((count / this.investigations.length) * 100).toFixed(1);
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(type)}</span>
              <span style="font-size:12px;color:var(--text-dim);">${count} (${pct}%)</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const statusHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Status</div>
        ${statusEntries.map(([status, count]) => {
          const color = status === 'Active' ? '#ef4444' : status === 'Resolved' ? '#22c55e' : '#f59e0b';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(status)}</span>
              <span style="font-size:12px;color:${color};font-weight:600;">${count}</span>
            </div>
          `;
        }).join('')}
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
      ${typeHtml}
      ${statusHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto CKAN • Updated: ${escapeHtml(formattedLastUpdated)}
      </small>
    `;
  }
}