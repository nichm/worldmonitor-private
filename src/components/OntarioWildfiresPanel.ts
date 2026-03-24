/**
 * Ontario Wildfire & Fire Risk Zones Panel
 */

import type { WildfireIncident, FireRiskZone } from '@/config/ontario-wildfires';
import { getWildfireColor, getFireRiskZoneColor } from '@/config/ontario-wildfires';
import { fetchOntarioWildfires } from '@/services/ontario-wildfires';
import { t } from '@/services/i18n';

export class OntarioWildfiresPanel {
  private container: HTMLElement;
  private wildfires: WildfireIncident[] = [];
  private riskZones: FireRiskZone[] = [];
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
      const data = await fetchOntarioWildfires();
      this.wildfires = data.wildfires;
      this.riskZones = data.riskZones;
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
          <h3>${t('panels.ontarioWildfires.title')}</h3>
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
          <h3>${t('panels.ontarioWildfires.title')}</h3>
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

    if (!this.wildfires || this.wildfires.length === 0) {
      this.container.innerHTML = `
        <div class="panel-header">
          <h3>${t('panels.ontarioWildfires.title')}</h3>
          <span class="panel-badge">0 ${t('common.fires')}</span>
        </div>
        <div class="panel-content">
          <div style="padding:32px;text-align:center;color:var(--text-dim);">
            <p style="margin:0 0 8px 0;">No wildfire data available</p>
            <small style="font-size:12px;">Data sourced from Ontario Ministry of Natural Resources</small>
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

    const activeFires = this.wildfires.filter(w => w.status === 'ongoing' || w.status === 'not_contained').length;
    const totalSize = this.wildfires.reduce((sum, w) => sum + (w.size || 0), 0);
    const highRiskZones = this.riskZones.filter(z => z.riskLevel === 'high' || z.riskLevel === 'extreme').length;

    this.container.innerHTML = `
      <div class="panel-header">
        <h3>${t('panels.ontarioWildfires.title')}</h3>
        <span class="panel-badge">${this.wildfires.length} ${t('common.fires')}</span>
      </div>
      <div class="panel-content">
        <div class="stat-grid stat-grid--compact">
          <div class="stat-card">
            <span class="stat-value">${activeFires}</span>
            <span class="stat-label">${t('panels.ontarioWildfires.activeFires')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${totalSize.toFixed(1)}</span>
            <span class="stat-label">${t('panels.ontarioWildfires.totalSize')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${highRiskZones}</span>
            <span class="stat-label">${t('panels.ontarioWildfires.highRiskZones')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${this.riskZones.length}</span>
            <span class="stat-label">${t('panels.ontarioWildfires.riskZones')}</span>
          </div>
        </div>
        <div class="wildfire-list">
          ${this.wildfires.slice(0, 25).map(w => `
            <div class="wildfire-item">
              <div class="wildfire-status" style="background: rgba(${getWildfireColor(w.status).join(',')})"></div>
              <div class="wildfire-info">
                <div class="wildfire-name">${w.name}</div>
                <div class="wildfire-details">
                  ${w.size ? `${w.size} ha` : ''} • ${w.status} • ${w.region || 'Unknown'}
                </div>
                <div class="wildfire-cause">${w.cause || 'Unknown cause'}</div>
              </div>
            </div>
          `).join('')}
          ${this.wildfires.length > 25 ? `<div style="text-align:center;padding:8px;color:var(--text-dim);font-size:12px;">+ ${this.wildfires.length - 25} more fires</div>` : ''}
        </div>
        <div class="risk-zones-list">
          <h4>${t('panels.ontarioWildfires.riskZones')}</h4>
          ${this.riskZones.slice(0, 20).map(z => `
            <div class="risk-zone-item">
              <div class="risk-zone-level risk-zone-level--${z.riskLevel}">${z.riskLevel.toUpperCase()}</div>
              <div class="risk-zone-info">
                <div class="risk-zone-name">${z.name}</div>
                <div class="risk-zone-description">${z.description}</div>
              </div>
            </div>
          `).join('')}
          ${this.riskZones.length > 20 ? `<div style="text-align:center;padding:8px;color:var(--text-dim);font-size:12px;">+ ${this.riskZones.length - 20} more zones</div>` : ''}
        </div>
        <div class="panel-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <p class="panel-note" style="font-size: 11px; color: var(--text-dim); margin: 0;">
            Source: Ontario Ministry of Natural Resources • Updated: ${formattedLastUpdated}
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