/**
 * Road Construction & Closures Panel
 */

import type { RoadConstructionEvent } from '@/config/road-construction';
import { getRoadConstructionColor, getRoadConstructionIcon } from '@/config/road-construction';
import { fetchRoadConstruction } from '@/services/road-construction';
import { t } from '@/services/i18n';

export class RoadConstructionPanel {
  private container: HTMLElement;
  private events: RoadConstructionEvent[] = [];
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
      this.events = await fetchRoadConstruction();
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
          <h3>${t('panels.roadConstruction.title')}</h3>
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
          <h3>${t('panels.roadConstruction.title')}</h3>
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

    if (!this.events || this.events.length === 0) {
      this.container.innerHTML = `
        <div class="panel-header">
          <h3>${t('panels.roadConstruction.title')}</h3>
          <span class="panel-badge">0 ${t('common.events')}</span>
        </div>
        <div class="panel-content">
          <div style="padding:32px;text-align:center;color:var(--text-dim);">
            <p style="margin:0 0 8px 0;">No road construction data available</p>
            <small style="font-size:12px;">Data sourced from City of Toronto Open Data</small>
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

    const activeCount = this.events.filter(e => e.status?.toLowerCase() === 'active').length;
    const majorCount = this.events.filter(e => e.classification?.toLowerCase().includes('major')).length;

    this.container.innerHTML = `
      <div class="panel-header">
        <h3>${t('panels.roadConstruction.title')}</h3>
        <span class="panel-badge">${this.events.length} ${t('common.events')}</span>
      </div>
      <div class="panel-content">
        <div class="stat-grid stat-grid--compact">
          <div class="stat-card">
            <span class="stat-value">${activeCount}</span>
            <span class="stat-label">${t('panels.roadConstruction.active')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${majorCount}</span>
            <span class="stat-label">${t('panels.roadConstruction.major')}</span>
          </div>
        </div>
        <div class="construction-list">
          ${this.events.slice(0, 25).map(e => `
            <div class="construction-item ${e.status?.toLowerCase() === 'active' ? 'construction-item--active' : ''}">
              <span class="construction-icon">${getRoadConstructionIcon(e.eventType)}</span>
              <div class="construction-info">
                <div class="construction-title">${e.eventTitle}</div>
                <div class="construction-road">${e.roadName || 'Unknown road'}</div>
                <div class="construction-details">
                  ${e.from && e.to ? `${e.from} → ${e.to}` : e.from || e.to || ''}
                  ${e.direction ? ` • ${e.direction}` : ''}
                </div>
                <div class="construction-status">${e.status}</div>
              </div>
            </div>
          `).join('')}
          ${this.events.length > 25 ? `<div class="construction-more">+${this.events.length - 25} more events</div>` : ''}
        </div>
        <div class="panel-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <p class="panel-note" style="font-size: 11px; color: var(--text-dim); margin: 0;">
            Source: City of Toronto Open Data • Updated: ${formattedLastUpdated}
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