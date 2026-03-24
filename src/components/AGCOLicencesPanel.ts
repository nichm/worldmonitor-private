/**
 * AGCOLicencesPanel -- displays Toronto AGCO liquor licences stats
 * Shows total licences, by type (convenience, grocery, LCBO agency), and ward distribution
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { AGCOLicence } from '@/config/agco-licences';
import { getLicenceTypeColor } from '@/config/agco-licences';

export class AGCOLicencesPanel extends Panel {
  private licences: AGCOLicence[] = [];

  constructor() {
    super({
      id: 'agco-licences',
      title: 'Liquor Licences',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'AGCO liquor licences in Toronto — convenience stores, grocery stores, and LCBO agencies.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: { licences: AGCOLicence[]; total: number; byType: Record<string, number>; byWard: Record<string, number> } | null): void {
    if (data) {
      this.licences = data.licences;
      this.setCount(data.total);
      this.renderContent(data);
    }
  }

  private renderContent(data: { licences: AGCOLicence[]; total: number; byType: Record<string, number>; byWard: Record<string, number> }): void {
    if (!data || !data.licences || data.licences.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No licence data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from AGCO</small>
      </div>`;
      return;
    }

    const { total, byType, byWard } = data;

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${total.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Licences</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#10b981;">${Object.keys(byWard).length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Wards</div>
        </div>
      </div>
    `;

    // Licence type breakdown
    const typeEntries = Object.entries(byType)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Licence Type</div>
        ${typeEntries.map(([licenceType, count]) => {
          const color = getLicenceTypeColor(licenceType);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          const label = licenceType.replace(/_/g, ' ');
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>
                <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(label)}</span>
              </div>
              <div style="display:flex;gap:12px;font-size:12px;">
                <span style="color:var(--text-dim);">${count} licences</span>
                <span style="color:${color};font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Ward distribution (top 5)
    const wardEntries = Object.entries(byWard)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const wardHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Top Wards</div>
        ${wardEntries.map(([ward, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);">${escapeHtml(ward)}</span>
              <div style="display:flex;gap:8px;font-size:12px;">
                <span style="color:var(--text-dim);">${count}</span>
                <span style="color:var(--text);font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${typeHtml}
      ${wardHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: AGCO (Alcohol and Gaming Commission of Ontario) — refreshed weekly
      </small>
    `;
  }
}