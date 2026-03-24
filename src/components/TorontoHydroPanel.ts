/**
 * TorontoHydroPanel -- displays Toronto Hydro power outage data
 * Shows active outages, customers affected, and restoration estimates
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { TorontoHydroOutage } from '@/config/toronto-hydro';

export class TorontoHydroPanel extends Panel {
  private outages: TorontoHydroOutage[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'toronto-hydro',
      title: 'Toronto Hydro Outages',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto Hydro power outage information — active outages and restoration estimates.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: TorontoHydroOutage[] | null, lastUpdated?: string): void {
    if (data) {
      this.outages = data;
      this.lastUpdated = lastUpdated;
      const active = data.filter(o => o.status === 'Active');
      this.setCount(active.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.outages || this.outages.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No outage data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto Hydro</small>
      </div>`;
      return;
    }

    const active = this.outages.filter(o => o.status === 'Active');
    const resolved = this.outages.filter(o => o.status !== 'Active');
    const totalAffected = active.reduce((s, o) => s + (o.affected || 0), 0);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#ef4444;">${active.length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Active Outages</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${totalAffected.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Customers Affected</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#22c55e;">${resolved.length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Resolved</div>
        </div>
      </div>
    `;

    const outagesHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">
          ${active.length > 0 ? 'Active Outages' : 'Recent Activity'}
          <span style="font-weight:400;color:var(--text-dim);margin-left:8px;">(showing up to 20)</span>
        </div>
        ${this.outages.slice(0, 20).map(outage => {
          const isActive = outage.status === 'Active';
          const statusColor = isActive ? '#ef4444' : '#22c55e';
          return `
            <div style="display:flex;align-items:flex-start;gap:8px;padding:10px;background:var(--bg-elevated);border-radius:6px;margin-bottom:6px;border-left:3px solid ${statusColor};">
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <span style="font-size:13px;font-weight:600;color:var(--text);">${escapeHtml(outage.area)}</span>
                  <span style="padding:2px 8px;border-radius:4px;background:${statusColor}20;color:${statusColor};font-size:11px;font-weight:500;white-space:nowrap;">
                    ${escapeHtml(outage.status)}
                  </span>
                </div>
                <div style="font-size:12px;color:var(--text-dim);margin-bottom:2px;">
                  ${escapeHtml(outage.cause)} — ${outage.affected || 0} customers
                </div>
                ${outage.estimatedRestoration ? `
                  <div style="font-size:11px;color:var(--text-dim);">
                    Est. restoration: ${new Date(outage.estimatedRestoration).toLocaleString('en-CA', {
                      timeZone: 'America/Toronto',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
        ${this.outages.length > 20 ? `<small style="display:block;text-align:center;color:var(--text-dim);padding:8px;">Showing 20 of ${this.outages.length} events</small>` : ''}
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
      ${outagesHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto Hydro • Updated: ${escapeHtml(formattedLastUpdated)}
      </small>
    `;
  }
}
