/**
 * LakeOntarioLevelPanel -- displays Toronto waterfront water level stats
 * Shows current level, 24h trend, historical range, and reference datum
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { WaterLevelReading, WaterLevelSummary } from '@/config/lake-ontario-level';
import { summarizeWaterLevel } from '@/config/lake-ontario-level';

export class LakeOntarioLevelPanel extends Panel {
  private readings: WaterLevelReading[] = [];

  constructor() {
    super({
      id: 'lake-ontario-level',
      title: 'Lake Ontario Level',
      showCount: false,
      trackActivity: false,
      infoTooltip: 'Lake Ontario water level at Toronto — current level and historical context.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: WaterLevelReading[] | null): void {
    if (data) {
      this.readings = data;
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.readings || this.readings.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No water level data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from NOAA Tides & Currents</small>
      </div>`;
      return;
    }

    const summary: WaterLevelSummary = summarizeWaterLevel(this.readings);

    const trendColor = summary.trend > 0 ? '#22c55e' : summary.trend < 0 ? '#ef4444' : 'var(--text)';
    const trendSymbol = summary.trend > 0 ? '↑' : summary.trend < 0 ? '↓' : '→';
    const trendText = Math.abs(summary.trend * 100).toFixed(1) + ' cm';

    const summaryHtml = `
      <div style="padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="font-size:28px;font-weight:600;color:var(--text);">
            ${summary.currentLevelMeters.toFixed(2)} m
          </div>
          <div style="font-size:14px;color:var(--text-dim);">(${summary.currentLevelFt.toFixed(1)} ft IGLD)</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
          <div style="text-align:center;">
            <div style="font-size:16px;font-weight:600;color:${trendColor};">
              ${trendSymbol} ${trendText}
            </div>
            <div style="font-size:11px;color:var(--text-dim);">24h Trend</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:16px;font-weight:600;color:${summary.isAboveAverage ? '#22c55e' : '#f59e0b'};">
              ${summary.isAboveAverage ? 'Above' : 'Below'}
            </div>
            <div style="font-size:11px;color:var(--text-dim);">Long-term Avg</div>
          </div>
        </div>
      </div>
    `;

    const historicalHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Historical Range</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:10px;height:10px;border-radius:2px;background:#ef4444;display:inline-block;"></span>
            <span style="font-size:13px;color:var(--text);font-weight:500;">Record High</span>
          </div>
          <div style="font-size:12px;color:#ef4444;font-weight:600;">${summary.historicalHighMeters.toFixed(2)} m</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:10px;height:10px;border-radius:2px;background:#3b82f6;display:inline-block;"></span>
            <span style="font-size:13px;color:var(--text);font-weight:500;">Record Low</span>
          </div>
          <div style="font-size:12px;color:#3b82f6;font-weight:600;">${summary.historicalLowMeters.toFixed(2)} m</div>
        </div>
      </div>
    `;

    const lastUpdated = summary.timestamp
      ? new Date(summary.timestamp).toLocaleString('en-CA', {
          timeZone: 'America/Toronto',
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : 'Unknown';

    this.content.innerHTML = `
      ${summaryHtml}
      ${historicalHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: NOAA Tides & Currents — IGLD datum • Updated: ${escapeHtml(lastUpdated)}
      </small>
    `;
  }
}