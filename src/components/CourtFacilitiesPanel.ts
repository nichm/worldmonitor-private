/**
 * Court & Judicial Facility Locations Panel
 */

import type { CourtFacility } from '@/config/court-facilities';
import { getCourtFacilityColor, getCourtFacilityIcon } from '@/config/court-facilities';
import { fetchCourtFacilities } from '@/services/court-facilities';
import { t } from '@/services/i18n';

export class CourtFacilitiesPanel {
  private container: HTMLElement;
  private facilities: CourtFacility[] = [];
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
      this.facilities = await fetchCourtFacilities();
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
          <h3>${t('panels.courtFacilities.title')}</h3>
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
          <h3>${t('panels.courtFacilities.title')}</h3>
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

    if (!this.facilities || this.facilities.length === 0) {
      this.container.innerHTML = `
        <div class="panel-header">
          <h3>${t('panels.courtFacilities.title')}</h3>
          <span class="panel-badge">0 ${t('common.facilities')}</span>
        </div>
        <div class="panel-content">
          <div style="padding:32px;text-align:center;color:var(--text-dim);">
            <p style="margin:0 0 8px 0;">No court facility data available</p>
            <small style="font-size:12px;">Data sourced from Ontario Court Services</small>
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

    const typeCounts = this.facilities.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.container.innerHTML = `
      <div class="panel-header">
        <h3>${t('panels.courtFacilities.title')}</h3>
        <span class="panel-badge">${this.facilities.length} ${t('common.facilities')}</span>
      </div>
      <div class="panel-content">
        <div class="stat-grid stat-grid--compact">
          <div class="stat-card">
            <span class="stat-value">${typeCounts.provincial || 0}</span>
            <span class="stat-label">${t('panels.courtFacilities.types.provincial')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${typeCounts.federal || 0}</span>
            <span class="stat-label">${t('panels.courtFacilities.types.federal')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${typeCounts.small_claims || 0}</span>
            <span class="stat-label">${t('panels.courtFacilities.types.smallClaims')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${typeCounts.family || 0}</span>
            <span class="stat-label">${t('panels.courtFacilities.types.family')}</span>
          </div>
        </div>
        <div class="facility-list">
          ${this.facilities.slice(0, 30).map(f => `
            <div class="facility-item">
              <span class="facility-icon">${getCourtFacilityIcon(f.type)}</span>
              <div class="facility-info">
                <div class="facility-name">${f.name}</div>
                <div class="facility-address">${f.address}</div>
                <div class="facility-type">${t(`panels.courtFacilities.types.${f.type}`)}</div>
              </div>
            </div>
          `).join('')}
          ${this.facilities.length > 30 ? `<div style="text-align:center;padding:8px;color:var(--text-dim);font-size:12px;">+ ${this.facilities.length - 30} more</div>` : ''}
        </div>
        <div class="panel-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <p class="panel-note" style="font-size: 11px; color: var(--text-dim); margin: 0;">
            Source: Ontario Court Services • Updated: ${formattedLastUpdated}
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