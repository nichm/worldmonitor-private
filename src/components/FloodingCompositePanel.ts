/**
 * Flooding Composite Panel
 */

import type { FloodZone, FloodReport, HydrometricStation } from '@/config/flooding-composite';
import { getFloodZoneColor, getFloodReportColor, getHydrometricStationColor } from '@/config/flooding-composite';
import { fetchFloodingComposite } from '@/services/flooding-composite';
import { t } from '@/services/i18n';

export class FloodingCompositePanel {
  private container: HTMLElement;
  private floodZones: FloodZone[] = [];
  private floodReports: FloodReport[] = [];
  private hydrometricStations: HydrometricStation[] = [];
  private loading = true;
  private error: string | null = null;
  private lastUpdated?: string;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    this.render();
    await this.loadData();
  }

  destroy(): void {
    this.container.innerHTML = '';
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const data = await fetchFloodingComposite();
      this.floodZones = data.floodZones;
      this.floodReports = data.floodReports;
      this.hydrometricStations = data.hydrometricStations;
      this.loading = false;
      this.render();
    } catch (err) {
      this.error = String(err);
      this.loading = false;
      this.render();
    }
  }

  private render(): void {
    if (this.loading) {
      this.container.innerHTML = `
        <div class="panel-header">
          <h3>${t('panels.floodingComposite.title')}</h3>
          <span class="panel-badge">${t('common.loading')}</span>
        </div>
        <div class="panel-loading">
          <div class="spinner"></div>
        </div>
      `;
      return;
    }

    if (this.error) {
      this.container.innerHTML = `
        <div class="panel-header">
          <h3>${t('panels.floodingComposite.title')}</h3>
          <span class="panel-badge panel-badge--error">${t('common.error')}</span>
        </div>
        <div class="panel-error">
          <p>${this.error}</p>
          <button class="btn btn--small btn--secondary" data-action="retry">${t('common.retry')}</button>
        </div>
      `;

      this.container.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
        void this.loadData();
      });
      return;
    }

    if ((!this.floodReports || this.floodReports.length === 0) && (!this.hydrometricStations || this.hydrometricStations.length === 0)) {
      this.container.innerHTML = `
        <div class="panel-header">
          <h3>${t('panels.floodingComposite.title')}</h3>
          <span class="panel-badge">0 ${t('panels.floodingComposite.openReports')}</span>
        </div>
        <div class="panel-content">
          <div style="padding:32px;text-align:center;color:var(--text-dim);">
            <p style="margin:0 0 8px 0;">No flooding data available</p>
            <small style="font-size:12px;">Data sourced from multiple sources</small>
          </div>
        </div>
      `;
      return;
    }

    // Format last updated timestamp
    const formattedLastUpdated = this.lastUpdated
      ? new Date(this.lastUpdated).toLocaleString('en-CA', {
          timeZone: 'America/Toronto',
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : 'Unknown';

    const openReports = this.floodReports.filter(r => r.status === 'open' || r.status === 'in_progress').length;
    const highRiskZones = this.floodZones.filter(z => z.riskLevel === 'high' || z.riskLevel === 'very_high').length;
    const nearFloodStage = this.hydrometricStations.filter(s => {
      if (!s.waterLevel || !s.floodStage) return false;
      return s.waterLevel / s.floodStage >= 0.8;
    }).length;

    this.container.innerHTML = `
      <div class="panel-header">
        <h3>${t('panels.floodingComposite.title')}</h3>
        <span class="panel-badge">${openReports} ${t('panels.floodingComposite.openReports')}</span>
      </div>
      <div class="panel-content">
        <div class="stat-grid stat-grid--compact">
          <div class="stat-card">
            <span class="stat-value">${openReports}</span>
            <span class="stat-label">${t('panels.floodingComposite.openReports')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${highRiskZones}</span>
            <span class="stat-label">${t('panels.floodingComposite.highRiskZones')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${nearFloodStage}</span>
            <span class="stat-label">${t('panels.floodingComposite.nearFloodStage')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${this.hydrometricStations.length}</span>
            <span class="stat-label">${t('panels.floodingComposite.stations')}</span>
          </div>
        </div>
        <div class="hydrometric-list">
          ${this.hydrometricStations.slice(0, 25).map(s => `
            <div class="hydrometric-item">
              <div class="hydrometric-level" style="background: rgba(${getHydrometricStationColor(s.waterLevel, s.floodStage).join(',')})"></div>
              <div class="hydrometric-info">
                <div class="hydrometric-name">${s.name}</div>
                <div class="hydrometric-details">
                  ${s.waterLevel !== null ? `${s.waterLevel.toFixed(2)} m` : 'N/A'} ${s.waterLevelTrend ? `(${s.waterLevelTrend})` : ''}
                  ${s.floodStage ? ` / ${s.floodStage.toFixed(2)} m stage` : ''}
                </div>
                <div class="hydrometric-watercourse">${s.watercourse}</div>
              </div>
            </div>
          `).join('')}
          ${this.hydrometricStations.length > 25 ? `<div style="text-align:center;padding:8px;color:var(--text-dim);font-size:12px;">+ ${this.hydrometricStations.length - 25} more stations</div>` : ''}
        </div>
        <div class="flood-reports-list">
          ${this.floodReports.slice(0, 20).map(r => `
            <div class="flood-report-item">
              <div class="flood-report-severity flood-report-severity--${r.severity}"></div>
              <div class="flood-report-info">
                <div class="flood-report-type">${t(`panels.floodingComposite.types.${r.reportType}`)}</div>
                <div class="flood-report-location">${r.location}</div>
                <div class="flood-report-status">${r.status}</div>
              </div>
            </div>
          `).join('')}
          ${this.floodReports.length > 20 ? `<div class="flood-report-more">+${this.floodReports.length - 20} more reports</div>` : ''}
        </div>
        <div class="panel-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <p class="panel-note" style="font-size: 11px; color: var(--text-dim); margin: 0;">
            Source: Multiple sources • Updated: ${formattedLastUpdated}
          </p>
        </div>
      </div>
    `;
  }

  isNearViewport(marginPx = 400): boolean {
    const rect = this.container.getBoundingClientRect();
    return (
      rect.bottom >= -marginPx &&
      rect.top <= window.innerHeight + marginPx
    );
  }
}