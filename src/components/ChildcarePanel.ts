/**
 * ChildcarePanel -- displays Toronto licensed childcare centres stats
 * Shows total centres, breakdown by age group, and operator distribution
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { ChildcareCentre } from '@/config/childcare';
import { getAgeGroupColor } from '@/config/childcare';

export class ChildcarePanel extends Panel {
  private centres: ChildcareCentre[] = [];

  constructor() {
    super({
      id: 'childcare',
      title: 'Childcare Centres',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Licensed childcare centres in Toronto — age group breakdown and operator distribution.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: { centres: ChildcareCentre[]; total: number; byAgeGroup: Record<string, number>; byOperator: Record<string, number> } | null): void {
    if (data) {
      this.centres = data.centres;
      this.setCount(data.total);
      this.renderContent(data);
    }
  }

  private renderContent(data: { centres: ChildcareCentre[]; total: number; byAgeGroup: Record<string, number>; byOperator: Record<string, number> }): void {
    if (!data || !data.centres || data.centres.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No childcare data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Ontario Ministry of Education</small>
      </div>`;
      return;
    }

    const { total, byAgeGroup, byOperator } = data;

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${total.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Centres</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#10b981;">${Object.keys(byOperator).length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Operators</div>
        </div>
      </div>
    `;

    // Age group breakdown
    const ageGroupEntries = Object.entries(byAgeGroup)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const ageGroupHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Age Group</div>
        ${ageGroupEntries.map(([ageGroup, count]) => {
          const color = getAgeGroupColor(ageGroup);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>
                <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(ageGroup)}</span>
              </div>
              <div style="display:flex;gap:12px;font-size:12px;">
                <span style="color:var(--text-dim);">${count} centres</span>
                <span style="color:${color};font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Top operators (max 5)
    const operatorEntries = Object.entries(byOperator)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const operatorHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Top Operators</div>
        ${operatorEntries.map(([operator, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);">${escapeHtml(operator)}</span>
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
      ${ageGroupHtml}
      ${operatorHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Ontario Ministry of Education — refreshed monthly
      </small>
    `;
  }
}