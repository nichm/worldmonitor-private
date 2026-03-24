/**
 * ParksRecreationPanel -- Toronto parks & recreation facilities
 * Shows summary stats, amenity filters, and facility list with live open/closed status
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { ParksRecreationFacility } from '@/config/parks-recreation';
import { AMENITY_CONFIG } from '@/config/parks-recreation';
import { countByAmenity, countByLiveStatus } from '@/services/parks-recreation';
import { t } from '@/services/i18n';

export class ParksRecreationPanel extends Panel {
  private data: ParksRecreationFacility[] = [];
  private activeFilter: string | null = null;

  constructor() {
    super({
      id: 'parks-recreation',
      title: 'Parks & Recreation',
      showCount: true,
      trackActivity: false,
      infoTooltip: `Toronto parks & recreation facilities with live open/closed status. ${AMENITY_CONFIG.pool.icon} Pool ${AMENITY_CONFIG.rink.icon} Rink ${AMENITY_CONFIG.gym.icon} Gym ${AMENITY_CONFIG.playground.icon} Playground ${AMENITY_CONFIG.field.icon} Field ${AMENITY_CONFIG.court.icon} Court`,
    });
    this.showLoading(t('common.loading'));
  }

  public setData(data: ParksRecreationFacility[]): void {
    this.data = data;
    this.setCount(data.length);
    this.activeFilter = null;
    this.renderContent();
  }

  private getStatusIndicator(status: string): { color: string; label: string } {
    switch (status) {
      case 'open': return { color: 'var(--success-color)', label: 'Open' };
      case 'closed': return { color: 'var(--danger-color)', label: 'Closed' };
      case 'limited': return { color: 'var(--warning-color)', label: 'Limited' };
      default: return { color: 'var(--text-dim)', label: 'Unknown' };
    }
  }

  private renderContent(): void {
    if (!this.data || this.data.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No facilities loaded</p>
        <small style="font-size:12px;">Toronto parks & recreation data</small>
      </div>`;
      return;
    }

    const amenityCounts = countByAmenity(this.data);
    const statusCounts = countByLiveStatus(this.data);
    const openCount = statusCounts['open'] || 0;
    const closedCount = statusCounts['closed'] || 0;
    const limitedCount = statusCounts['limited'] || 0;
    const amenityTypes = Object.keys(amenityCounts).sort((a, b) => amenityCounts[b] - amenityCounts[a]);

    // Summary stats
    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:12px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${this.data.length}</div>
          <div style="font-size:11px;color:var(--text-dim);">Total</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--success-color);">${openCount}</div>
          <div style="font-size:11px;color:var(--text-dim);">Open</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--danger-color);">${closedCount}</div>
          <div style="font-size:11px;color:var(--text-dim);">Closed</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--warning-color);">${limitedCount}</div>
          <div style="font-size:11px;color:var(--text-dim);">Limited</div>
        </div>
      </div>
    `;

    // Amenity filter buttons
    const filterHtml = `
      <div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:12px;">
        <button class="parks-filter-btn${!this.activeFilter ? ' active' : ''}" data-filter=""
          style="padding:4px 10px;border-radius:12px;border:1px solid var(--border-color);background:${!this.activeFilter ? 'var(--accent-color)' : 'transparent'};color:${!this.activeFilter ? '#fff' : 'var(--text-dim)'};font-size:11px;cursor:pointer;transition:all 0.15s;">
          All (${this.data.length})
        </button>
        ${amenityTypes.filter(t => t !== 'other').map(type => {
          const cfg = AMENITY_CONFIG[type as keyof typeof AMENITY_CONFIG];
          if (!cfg) return '';
          const isActive = this.activeFilter === type;
          return `<button class="parks-filter-btn${isActive ? ' active' : ''}" data-filter="${type}"
            style="padding:4px 10px;border-radius:12px;border:1px solid ${isActive ? cfg.color : 'var(--border-color)'};background:${isActive ? cfg.color : 'transparent'};color:${isActive ? '#fff' : 'var(--text-dim)'};font-size:11px;cursor:pointer;transition:all 0.15s;">
            ${cfg.icon} ${cfg.label} (${amenityCounts[type]})
          </button>`;
        }).join('')}
      </div>
    `;

    // Filtered data
    const filtered = this.activeFilter
      ? this.data.filter(f => f.amenityType === this.activeFilter || f.amenityFlags?.includes(this.activeFilter!))
      : this.data;

    // Facility list (limit to 30)
    const listHtml = filtered.slice(0, 30).map(facility => {
      const statusInfo = this.getStatusIndicator(facility.liveStatus);
      const amenityCfg = AMENITY_CONFIG[facility.amenityType] || AMENITY_CONFIG.other;

      return `
        <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:6px;margin-bottom:6px;border-left:3px solid ${amenityCfg.color};display:flex;align-items:flex-start;gap:8px;">
          <div style="flex-shrink:0;font-size:16px;margin-top:1px;">${amenityCfg.icon}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;color:var(--text);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(facility.name)}</div>
            <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${escapeHtml(facility.address)}</div>
            ${facility.liveDetail ? `<div style="font-size:11px;color:var(--text-dim);margin-top:2px;opacity:0.7;">${escapeHtml(facility.liveDetail)}</div>` : ''}
          </div>
          <div style="flex-shrink:0;padding:2px 8px;border-radius:4px;background:${statusInfo.color}20;color:${statusInfo.color};font-size:11px;font-weight:500;white-space:nowrap;">
            ${statusInfo.label}
          </div>
        </div>
      `;
    }).join('');

    this.content.innerHTML = `
      ${summaryHtml}
      ${filterHtml}
      <div>
        ${listHtml}
        ${filtered.length > 30 ? `<small style="display:block;text-align:center;color:var(--text-dim);padding:8px;">Showing 30 of ${filtered.length} facilities</small>` : ''}
      </div>
    `;

    // Bind filter buttons
    this.content.querySelectorAll('.parks-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = (btn as HTMLElement).getAttribute('data-filter') || null;
        this.activeFilter = filter;
        this.renderContent();
      });
    });
  }
}
