/**
 * FederalRidingsPanel -- displays federal electoral district boundaries
 * Shows riding names and counts
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { FederalRiding } from '@/config/federal-ridings';

export class FederalRidingsPanel extends Panel {
  private ridings: FederalRiding[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'federal-ridings',
      title: 'Federal Riding Boundaries',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Federal electoral district boundaries from Elections Canada (2023 Representation Order).',
    });
    this.showLoading('Loading...');
  }

  public setData(data: FederalRiding[] | null, lastUpdated?: string): void {
    if (data) {
      this.ridings = data;
      this.lastUpdated = lastUpdated;
      const torontoRidings = data.filter((r) => r.province === 'Ontario');
      this.setCount(torontoRidings.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.ridings || this.ridings.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No federal riding data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Elections Canada ESRI REST API</small>
      </div>`;
      return;
    }

    const torontoRidings = this.ridings.filter((r) => r.province === 'Ontario');
    const ontarioRidings = this.ridings.filter((r) => r.province === 'Ontario');

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${torontoRidings.length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Toronto Area Ridings</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#3b82f6;">${ontarioRidings.length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Ontario Total</div>
        </div>
      </div>
    `;

    // Riding list
    const ridingListHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Toronto Area Ridings</div>
        ${torontoRidings.slice(0, 10).map((riding) => `
          <div style="padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(riding.name)}</div>
            <div style="font-size:11px;color:var(--text-dim);">ID: ${riding.id}</div>
          </div>
        `).join('')}
        ${torontoRidings.length > 10 ? `<div style="text-align:center;padding:8px;color:var(--text-dim);font-size:12px;">+ ${torontoRidings.length - 10} more</div>` : ''}
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
      ${ridingListHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Elections Canada ESRI REST API • Updated: ${escapeHtml(formattedLastUpdated)}
      </small>
    `;
  }
}