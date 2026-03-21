/**
 * HousingTargetsPanel -- displays Ontario housing supply progress for GTA municipalities
 * Shows horizontal bar chart with municipality names vs target percentage
 * Color-coded: red (<60%), yellow (60-80%), green (>80%)
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { OntarioHousingTarget } from '@/types';
import { t } from '@/services/i18n';

export class HousingTargetsPanel extends Panel {
  private data: OntarioHousingTarget[] = [];

  constructor() {
    super({
      id: 'housing-targets',
      title: 'Ontario Housing Targets',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Housing supply progress for GTA municipalities. Showing 2025 target completion.',
    });
    this.showLoading(t('common.loading'));
  }

  public setData(data: OntarioHousingTarget[]): void {
    this.data = data;
    this.setCount(data.length);
    this.renderContent();
  }

  private renderContent(): void {
    if (!this.data || this.data.length === 0) {
      this.content.innerHTML = `<div class="housing-empty" style="padding:16px;color:var(--text-dim);text-align:center;">No housing data available</div>`;
      return;
    }

    // Calculate average progress
    const avgProgress = this.data.reduce((sum, d) => sum + d.Progress_Percentage, 0) / this.data.length;

    // Color function
    const getColor = (percentage: number): string => {
      if (percentage < 60) return 'var(--danger-color)';
      if (percentage < 80) return 'var(--warning-color)';
      return 'var(--success-color)';
    };

    // Summary stats
    const summaryHtml = `
      <div class="housing-summary" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div class="housing-stat" style="text-align:center;">
          <div class="housing-stat-value" style="font-size:20px;font-weight:600;color:var(--text);">${avgProgress.toFixed(1)}%</div>
          <div class="housing-stat-label" style="font-size:12px;color:var(--text-dim);">Average Progress</div>
        </div>
        <div class="housing-stat" style="text-align:center;">
          <div class="housing-stat-value" style="font-size:20px;font-weight:600;color:var(--text);">${this.data.length}</div>
          <div class="housing-stat-label" style="font-size:12px;color:var(--text-dim);">Municipalities</div>
        </div>
        <div class="housing-stat" style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:${getColor(avgProgress)};">${this.data.filter(d => d.Progress_Percentage >= 80).length}</div>
          <div class="housing-stat-label" style="font-size:12px;color:var(--text-dim);">On Target (≥80%)</div>
        </div>
      </div>
    `;

    // Bar chart
    const barsHtml = this.data.map(target => {
      const percentage = target.Progress_Percentage;
      const color = getColor(percentage);
      const width = Math.min(percentage, 100);

      return `
        <div class="housing-bar-row" style="margin-bottom:12px;">
          <div class="housing-label" style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px;color:var(--text);">
            <span>${escapeHtml(target.Municipality)}</span>
            <span style="font-weight:600;color:${color};">${percentage.toFixed(1)}%</span>
          </div>
          <div class="housing-bar-bg" style="width:100%;height:24px;background:var(--bg-elevated);border-radius:4px;overflow:hidden;position:relative;">
            <div class="housing-bar-fill" style="width:${width}%;height:100%;background:${color};transition:width 0.5s ease;"></div>
            <div class="housing-bar-text" style="position:absolute;top:50%;left:8px;transform:translateY(-50%);font-size:11px;color:var(--text);text-shadow:0 0 2px var(--bg);">
              ${target.Housing_Units.toLocaleString()} / ${target.Target.toLocaleString()} units
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Legend
    const legendHtml = `
      <div class="housing-legend" style="display:flex;gap:16px;margin-top:16px;padding:8px;background:var(--bg-elevated);border-radius:6px;font-size:12px;color:var(--text-dim);">
        <div style="display:flex;align-items:center;gap:4px;">
          <div style="width:12px;height:12px;border-radius:2px;background:var(--success-color);"></div>
          <span>On Target (≥80%)</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <div style="width:12px;height:12px;border-radius:2px;background:var(--warning-color);"></div>
          <span>Behind (60-80%)</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <div style="width:12px;height:12px;border-radius:2px;background:var(--danger-color);"></div>
          <span>At Risk (<60%)</span>
        </div>
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      <div class="housing-bars">${barsHtml}</div>
      ${legendHtml}
    `;
  }
}