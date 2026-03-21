/**
 * DineSafePanel -- displays Toronto restaurant closures
 * Shows list of recent closures from last 14 days
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { DineSafeClosure } from '@/types';
import { t } from '@/services/i18n';

export class DineSafePanel extends Panel {
  private data: DineSafeClosure[] = [];

  constructor() {
    super({
      id: 'dinesafe',
      title: 'DineSafe Closures',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto restaurant closures from the last 14 days. ESTABLISHMENT_STATUS = Closed.',
    });
    this.showLoading(t('common.loading'));
  }

  public setData(data: DineSafeClosure[]): void {
    this.data = data;
    this.setCount(data.length);
    this.renderContent();
  }

  private getSeverityColor(severity: string): string {
    const s = severity?.toLowerCase() || '';
    if (s.includes('severe') || s.includes('critical')) return 'var(--danger-color)';
    if (s.includes('significant') || s.includes('major')) return 'var(--warning-color)';
    if (s.includes('minor') || s.includes('low')) return 'var(--success-color)';
    return 'var(--text-dim)';
  }

  private renderContent(): void {
    if (!this.data || this.data.length === 0) {
      this.content.innerHTML = `<div class="dinesafe-empty" style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No recent closures found</p>
        <small style="font-size:12px;color:var(--text-dim);">Showing last 14 days, ESTABLISHMENT_STATUS = 'Closed'</small>
      </div>`;
      return;
    }

    // Count by severity
    const severityCounts: Record<string, number> = {};
    for (const closure of this.data) {
      const severity = closure.severity || 'Unknown';
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    }

    // Summary
    const summaryHtml = `
      <div class="dinesafe-summary" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div class="dinesafe-stat" style="text-align:center;">
          <div class="dinesafe-stat-value" style="font-size:20px;font-weight:600;color:var(--text);">${this.data.length}</div>
          <div class="dinesafe-stat-label" style="font-size:12px;color:var(--text-dim);">Closures (14d)</div>
        </div>
        <div class="dinesafe-stat" style="text-align:center;">
          <div class="dinesafe-stat-value" style="font-size:20px;font-weight:600;color:${this.getSeverityColor('severe')};">${Object.values(severityCounts).reduce((a, b) => a + b, 0)}</div>
          <div class="dinesafe-stat-label" style="font-size:12px;color:var(--text-dim);">By Severity</div>
        </div>
        <div class="dinesafe-stat" style="text-align:center;">
          <div class="dinesafe-stat-value" style="font-size:20px;font-weight:600;color:var(--text);">${Object.keys(severityCounts).length}</div>
          <div class="dinesafe-stat-label" style="font-size:12px;color:var(--text-dim);">Severity Types</div>
        </div>
      </div>
    `;

    // Closure list
    const closuresHtml = this.data.slice(0, 20).map(closure => {
      const severityColor = this.getSeverityColor(closure.severity);

      return `
        <div class="dinesafe-item" style="padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:8px;border-left:3px solid ${severityColor};">
          <div class="dinesafe-name" style="font-weight:600;color:var(--text);margin-bottom:4px;">${escapeHtml(closure.establishment_name)}</div>
          <div class="dinesafe-address" style="font-size:13px;color:var(--text-dim);margin-bottom:4px;">${escapeHtml(closure.establishment_address)}</div>
          <div class="dinesafe-meta" style="display:flex;gap:12px;font-size:12px;">
            <span style="color:${severityColor};font-weight:500;">${escapeHtml(closure.severity || 'Unknown')}</span>
            <span style="color:var(--text-dim);">${closure.inspection_date || 'Unknown date'}</span>
            <span style="color:var(--text-dim);">${escapeHtml(closure.action || 'Closure')}</span>
          </div>
          ${closure.infraction_details ? `
            <div class="dinesafe-details" style="margin-top:6px;padding:6px;background:var(--bg);border-radius:4px;font-size:12px;color:var(--text-dim);">
              ${escapeHtml(closure.infraction_details)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    this.content.innerHTML = `
      ${summaryHtml}
      <div class="dinesafe-list">
        ${closuresHtml}
        ${this.data.length > 20 ? `<small style="display:block;text-align:center;color:var(--text-dim);padding:8px;">Showing 20 of ${this.data.length} closures</small>` : ''}
      </div>
    `;
  }
}