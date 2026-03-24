/**
 * TrafficSignalsPanel -- displays Toronto traffic signal locations
 * Shows signal count and status breakdown
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { TrafficSignal } from '@/config/traffic-signals';

export class TrafficSignalsPanel extends Panel {
  private signals: TrafficSignal[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'traffic-signals',
      title: 'Traffic Signals',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto traffic signal locations by type and status.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: TrafficSignal[] | null, lastUpdated?: string): void {
    if (data) {
      this.signals = data;
      this.lastUpdated = lastUpdated;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.signals || this.signals.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No traffic signal data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto CKAN</small>
      </div>`;
      return;
    }

    // Count by type and status
    const byType = this.signals.reduce((acc, signal) => {
      acc[signal.type] = (acc[signal.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = this.signals.reduce((acc, signal) => {
      acc[signal.status] = (acc[signal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${this.signals.length.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Signals</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#22c55e;">${byStatus['Active'] || 0}</div>
          <div style="font-size:12px;color:var(--text-dim);">Active</div>
        </div>
      </div>
    `;

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Signal Type</div>
        ${typeEntries.slice(0, 5).map(([type, count]) => {
          const pct = ((count / this.signals.length) * 100).toFixed(1);
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(type)}</span>
              <span style="font-size:12px;color:var(--text-dim);">${count.toLocaleString()} (${pct}%)</span>
            </div>
          `;
        }).join('')}
        ${typeEntries.length > 5 ? `<div style="text-align:center;padding:8px;color:var(--text-dim);font-size:12px;">+ ${typeEntries.length - 5} more types</div>` : ''}
      </div>
    `;

    const statusHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Status</div>
        ${statusEntries.map(([status, count]) => {
          const color = status === 'Active' ? '#22c55e' : status === 'Inactive' ? '#ef4444' : '#f59e0b';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(status)}</span>
              <span style="font-size:12px;color:${color};font-weight:600;">${count.toLocaleString()}</span>
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