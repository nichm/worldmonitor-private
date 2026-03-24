/**
 * TorontoHydroOutagesPanel -- displays Toronto Hydro power outages
 * Shows outage severity, affected customers, and restoration estimates
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { TorontoHydroOutage } from '@/config/toronto-hydro-outages';

export class TorontoHydroOutagesPanel extends Panel {
  private outages: TorontoHydroOutage[] = [];

  constructor() {
    super({
      id: 'toronto-hydro-outages',
      title: 'Toronto Hydro Outages',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Current power outage locations and status.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: TorontoHydroOutage[] | null): void {
    if (data) {
      this.outages = data;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.outages || this.outages.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No current outages</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto Hydro</small>
      </div>`;
      return;
    }

    // Calculate totals
    const activeOutages = this.outages.filter((o) => o.status === 'active').length;
    const totalAffected = this.outages.reduce((sum, o) => sum + o.affected_customers, 0);
    const majorOutages = this.outages.filter((o) => o.severity === 'major').length;

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:600;color:var(--text);">${this.outages.length}</div>
          <div style="font-size:11px;color:var(--text-dim);">Total Outages</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:600;color:#ef4444;">${activeOutages}</div>
          <div style="font-size:11px;color:var(--text-dim);">Active</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:600;color:#f59e0b;">${totalAffected.toLocaleString()}</div>
          <div style="font-size:11px;color:var(--text-dim);">Affected</div>
        </div>
      </div>
    `;

    const outageListHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Outage Details</div>
        ${this.outages.map((outage) => {
          const severityColor = outage.severity === 'major' ? '#ef4444' : '#f59e0b';
          const statusColor = outage.status === 'active' ? '#ef4444' : '#3b82f6';
          return `
            <div style="padding:10px;background:var(--bg-elevated);border-radius:6px;margin-bottom:6px;border-left:3px solid ${severityColor};">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:13px;color:var(--text);font-weight:600;">${escapeHtml(outage.cause)}</span>
                <span style="font-size:11px;color:${severityColor};font-weight:600;text-transform:uppercase;">${outage.severity}</span>
              </div>
              <div style="display:flex;gap:16px;font-size:11px;color:var(--text-dim);">
                <span>${outage.affected_customers.toLocaleString()} customers</span>
                <span style="color:${statusColor};">${outage.status}</span>
              </div>
              ${outage.estimated_restoration !== 'TBD' ? `<div style="margin-top:4px;font-size:10px;color:var(--text-dim);">ETA: ${escapeHtml(outage.estimated_restoration)}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${outageListHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto Hydro — refreshed every 5 minutes
      </small>
      <small style="display:block;text-align:center;color:var(--text-dim);padding:0 0 4px;font-size:10px;">
        TODO: Find actual Toronto Hydro API
      </small>
    `;
  }
}