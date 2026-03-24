/**
 * TTC Real-Time Vehicle Positions Panel
 */

import type { TtcVehicle } from '@/config/ttc-realtime';
import { getTtcVehicleColor, getTtcVehicleIcon } from '@/config/ttc-realtime';
import { fetchTtcVehicles } from '@/services/ttc-realtime';
import { t } from '@/services/i18n';

export class TtcRealtimePanel {
  private container: HTMLElement;
  private vehicles: TtcVehicle[] = [];
  private loading = true;
  private error: string | null = null;

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
      this.vehicles = await fetchTtcVehicles();
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
          <h3>${t('panels.ttcRealtime.title')}</h3>
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
          <h3>${t('panels.ttcRealtime.title')}</h3>
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

    const routeTypeCounts = this.vehicles.reduce((acc, v) => {
      acc[v.routeType] = (acc[v.routeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgSpeed = this.vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / this.vehicles.length;

    this.container.innerHTML = `
      <div class="panel-header">
        <h3>${t('panels.ttcRealtime.title')}</h3>
        <span class="panel-badge">${this.vehicles.length} ${t('common.vehicles')}</span>
      </div>
      <div class="panel-content">
        <div class="stat-grid stat-grid--compact">
          <div class="stat-card">
            <span class="stat-value">${routeTypeCounts.subway || 0}</span>
            <span class="stat-label">${t('panels.ttcRealtime.types.subway')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${routeTypeCounts.streetcar || 0}</span>
            <span class="stat-label">${t('panels.ttcRealtime.types.streetcar')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${routeTypeCounts.bus || 0}</span>
            <span class="stat-label">${t('panels.ttcRealtime.types.bus')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${avgSpeed.toFixed(1)}</span>
            <span class="stat-label">${t('panels.ttcRealtime.avgSpeed')}</span>
          </div>
        </div>
        <div class="vehicle-list">
          ${this.vehicles.slice(0, 20).map(v => `
            <div class="vehicle-item">
              <span class="vehicle-icon">${getTtcVehicleIcon(v.routeType)}</span>
              <div class="vehicle-info">
                <div class="vehicle-route">Route ${v.routeId}</div>
                <div class="vehicle-type">${t(`panels.ttcRealtime.types.${v.routeType}`)} • ${v.direction || 'Unknown'}</div>
                <div class="vehicle-speed">${v.speed || 0} km/h</div>
              </div>
            </div>
          `).join('')}
          ${this.vehicles.length > 20 ? `<div class="vehicle-more">+${this.vehicles.length - 20} more vehicles</div>` : ''}
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