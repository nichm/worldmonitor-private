/**
 * FluClinicsPanel -- displays Toronto vaccination/flu clinics stats
 * Shows clinic count, by type, and seasonal notice
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { FluClinic } from '@/config/flu-clinics';
import { getClinicTypeColor, getSeasonalNotice } from '@/config/flu-clinics';

export class FluClinicsPanel extends Panel {
  private clinics: FluClinic[] = [];

  constructor() {
    super({
      id: 'flu-clinics',
      title: 'Flu Clinics',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Vaccination/flu clinics in Toronto — seasonal layer active October through March.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: { clinics: FluClinic[]; total: number; byType: Record<string, number> } | null): void {
    if (data) {
      this.clinics = data.clinics;
      this.setCount(data.total);
      this.renderContent(data);
    }
  }

  private renderContent(data: { clinics: FluClinic[]; total: number; byType: Record<string, number> }): void {
    const { total, byType } = data;

    // Show seasonal notice
    const seasonalNotice = getSeasonalNotice();
    const isSeasonalActive = seasonalNotice.includes('Active flu season');

    if (!isSeasonalActive) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;font-size:14px;color:var(--text);">Seasonal Layer</p>
        <p style="margin:0 0 8px 0;">${escapeHtml(seasonalNotice)}</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Ontario Public Health</small>
      </div>`;
      return;
    }

    if (!data || !data.clinics || data.clinics.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">${escapeHtml(seasonalNotice)}</p>
        <p style="margin:0 0 8px 0;">No clinic data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Ontario Public Health</small>
      </div>`;
      return;
    }

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${total.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Clinics</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#10b981;">${Object.keys(byType).length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Clinic Types</div>
        </div>
      </div>
    `;

    // Clinic type breakdown
    const typeEntries = Object.entries(byType)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Clinic Type</div>
        ${typeEntries.map(([clinicType, count]) => {
          const color = getClinicTypeColor(clinicType);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>
                <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(clinicType.replace(/_/g, ' '))}</span>
              </div>
              <div style="display:flex;gap:12px;font-size:12px;">
                <span style="color:var(--text-dim);">${count} clinics</span>
                <span style="color:${color};font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${typeHtml}
      <div style="margin:12px 0;padding:8px;background:#f0fdf4;border:1px solid #22c55e;border-radius:6px;">
        <p style="margin:0;font-size:12px;color:#166534;">${escapeHtml(seasonalNotice)}</p>
      </div>
      <small style="display:block;text-align:center;color:var(--text-dim);padding:8px 0 4px;font-size:11px;">
        Source: Ontario Public Health — refreshed daily during flu season
      </small>
    `;
  }
}