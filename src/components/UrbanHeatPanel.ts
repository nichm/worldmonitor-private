/**
 * UrbanHeatPanel -- displays Toronto Urban Heat Island zone data
 * Shows heat vulnerability zones, risk levels, and temperature differentials
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { UrbanHeatZone, UrbanHeatSummary } from '@/config/urban-heat';
import { summarizeUrbanHeat, getRiskLevelColor, getRiskLevelLabel } from '@/config/urban-heat';

export class UrbanHeatPanel extends Panel {
  private zones: UrbanHeatZone[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'urban-heat',
      title: 'Urban Heat Island',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto urban heat island zones — areas with elevated temperatures due to urban development.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: UrbanHeatZone[] | null, lastUpdated?: string): void {
    if (data) {
      this.zones = data;
      this.lastUpdated = lastUpdated;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.zones || this.zones.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No urban heat data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto urban development analysis</small>
      </div>`;
      return;
    }

    const summary: UrbanHeatSummary = summarizeUrbanHeat(this.zones);

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${summary.totalZones.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Heat Zones</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:${this.getHeatIndexColor(summary.averageHeatIndex)};">${summary.averageHeatIndex}</div>
          <div style="font-size:12px;color:var(--text-dim);">Avg Heat Index</div>
        </div>
      </div>
    `;

    const riskHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Risk Level Distribution</div>
        ${summary.criticalZones > 0 ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:10px;height:10px;border-radius:2px;background:${getRiskLevelColor('critical')};display:inline-block;"></span>
              <span style="font-size:13px;color:var(--text);font-weight:500;">Critical</span>
            </div>
            <div style="font-size:12px;color:${getRiskLevelColor('critical')};font-weight:600;">${summary.criticalZones} zones</div>
          </div>
        ` : ''}
        ${summary.highZones > 0 ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:10px;height:10px;border-radius:2px;background:${getRiskLevelColor('high')};display:inline-block;"></span>
              <span style="font-size:13px;color:var(--text);font-weight:500;">High</span>
            </div>
            <div style="font-size:12px;color:${getRiskLevelColor('high')};font-weight:600;">${summary.highZones} zones</div>
          </div>
        ` : ''}
        ${summary.mediumZones > 0 ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:10px;height:10px;border-radius:2px;background:${getRiskLevelColor('medium')};display:inline-block;"></span>
              <span style="font-size:13px;color:var(--text);font-weight:500;">Medium</span>
            </div>
            <div style="font-size:12px;color:${getRiskLevelColor('medium')};font-weight:600;">${summary.mediumZones} zones</div>
          </div>
        ` : ''}
        ${summary.lowZones > 0 ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:10px;height:10px;border-radius:2px;background:${getRiskLevelColor('low')};display:inline-block;"></span>
              <span style="font-size:13px;color:var(--text);font-weight:500;">Low</span>
            </div>
            <div style="font-size:12px;color:${getRiskLevelColor('low')};font-weight:600;">${summary.lowZones} zones</div>
          </div>
        ` : ''}
      </div>
    `;

    const highestRiskHtml = summary.highestRiskZone ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Highest Risk Zone</div>
        <div style="padding:12px;background:var(--bg-elevated);border-radius:6px;border-left:3px solid ${getRiskLevelColor(summary.highestRiskZone.riskLevel)};">
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;">${escapeHtml(summary.highestRiskZone.name)}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">${escapeHtml(summary.highestRiskZone.description)}</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-dim);">Heat Index</div>
              <div style="font-size:13px;font-weight:600;color:var(--text);">${summary.highestRiskZone.heatIndex}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-dim);">Temp Delta</div>
              <div style="font-size:13px;font-weight:600;color:var(--text);">+${summary.highestRiskZone.temperatureDelta.toFixed(1)}°C</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-dim);">Impervious</div>
              <div style="font-size:13px;font-weight:600;color:var(--text);">${summary.highestRiskZone.imperviousSurface}%</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-dim);">Green Space</div>
              <div style="font-size:13px;font-weight:600;color:var(--text);">${summary.highestRiskZone.greenSpace}%</div>
            </div>
          </div>
        </div>
      </div>
    ` : '';

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
      ${riskHtml}
      ${highestRiskHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Urban development analysis • Updated: ${escapeHtml(formattedLastUpdated)}
      </small>
    `;
  }

  private getHeatIndexColor(heatIndex: number): string {
    if (heatIndex >= 85) return '#ef4444';
    if (heatIndex >= 75) return '#f97316';
    if (heatIndex >= 65) return '#eab308';
    return '#22c55e';
  }
}