import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { DevelopmentCategory, TorontoDevelopmentData } from '@/services/toronto-development';
import {
  fetchTorontoDevelopmentData,
  getCategoryColor,
  getCategoryLabel,
} from '@/services/toronto-development';

export class DevelopmentPipelinePanel extends Panel {
  private data: TorontoDevelopmentData | null = null;
  private selectedCategory: DevelopmentCategory | 'all' = 'all';
  private categoryButtons: Map<string, HTMLElement> = new Map();
  private loading = false;
  private lastFetch = 0;

  constructor() {
    super({
      id: 'toronto-development',
      title: 'GTA Development Pipeline',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Active development applications from the last 365 days (excluding Refused/Withdrawn). Green: Site Plan (imminent), Yellow: Rezoning (pipeline), Blue: OPA (long-term).',
      defaultRowSpan: 2,
    });

    this.createFilters();
    this.showLoading('Loading development data...');
  }

  private createFilters(): void {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'development-filters';
    filterContainer.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;padding:0 4px;';

    const categories: Array<{ value: DevelopmentCategory | 'all'; label: string }> = [
      { value: 'all', label: 'All' },
      { value: 'site_plan', label: 'Site Plan' },
      { value: 'rezoning', label: 'Rezoning' },
      { value: 'opa', label: 'OPA' },
      { value: 'other', label: 'Other' },
    ];

    for (const { value, label } of categories) {
      const button = document.createElement('button');
      button.className = `development-category-btn ${value === this.selectedCategory ? 'active' : ''}`;
      button.dataset.category = value;
      button.style.cssText = `
        padding:6px 12px;
        border:1px solid var(--border-color);
        border-radius:4px;
        background:${value === this.selectedCategory ? 'var(--bg-elevated)' : 'var(--bg)'};
        color:${value === this.selectedCategory ? 'var(--text)' : 'var(--text-dim)'};
        font-size:12px;
        cursor:pointer;
        transition:all 0.2s;
      `;

      if (value !== 'all' && value !== 'other') {
        const color = getCategoryColor(value as DevelopmentCategory);
        button.style.borderColor = color;
        button.style.borderWidth = '2px';
      }

      button.textContent = label;
      button.onclick = () => this.selectCategory(value as DevelopmentCategory | 'all');

      this.categoryButtons.set(value, button);
      filterContainer.appendChild(button);
    }

    this.element.insertBefore(filterContainer, this.content);
  }

  private selectCategory(category: DevelopmentCategory | 'all'): void {
    if (this.selectedCategory === category) return;

    this.selectedCategory = category;
    this.categoryButtons.forEach(btn => {
      const btnEl = btn as HTMLElement;
      const isActive = btnEl.dataset.category === category;

      btnEl.classList.toggle('active', isActive);
      btnEl.style.background = isActive ? 'var(--bg-elevated)' : 'var(--bg)';
      btnEl.style.color = isActive ? 'var(--text)' : 'var(--text-dim)';

      const btnCategory = btnEl.dataset.category;
      if (btnCategory && btnCategory !== 'all' && btnCategory !== 'other') {
        const color = getCategoryColor(btnCategory as DevelopmentCategory);
        btnEl.style.borderColor = color;
        btnEl.style.borderWidth = isActive ? '2px' : '1px';
      } else {
        btnEl.style.borderWidth = '1px';
        btnEl.style.borderColor = 'var(--border-color)';
      }
    });

    this.renderContent();
  }

  public setData(data: TorontoDevelopmentData): void {
    this.data = data;
    this.setCount(data.total);
    this.renderContent();
  }

  private renderContent(): void {
    if (!this.data || !this.data.applications || this.data.applications.length === 0) {
      this.content.innerHTML = `
        <div style="padding:16px;color:var(--text-dim);text-align:center;">
          <p style="margin:0;">No development applications found</p>
          <small style="font-size:12px;color:var(--text-dim);margin-top:4px;display:block;">Showing last 365 days, excluding Refused/Withdrawn</small>
        </div>
      `;
      return;
    }

    const { applications, categoryCounts } = this.data;

    // Filter by selected category
    const filteredApps = this.selectedCategory === 'all'
      ? applications
      : applications.filter(app => app.category === this.selectedCategory);

    // Summary stats
    const summaryHtml = this.selectedCategory === 'all' ? `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:12px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${applications.length}</div>
          <div style="font-size:11px;color:var(--text-dim);">Total Active</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:${getCategoryColor('site_plan')};">${categoryCounts.site_plan}</div>
          <div style="font-size:11px;color:var(--text-dim);">Site Plan</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:${getCategoryColor('rezoning')};">${categoryCounts.rezoning}</div>
          <div style="font-size:11px;color:var(--text-dim);">Rezoning</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:${getCategoryColor('opa')};">${categoryCounts.opa}</div>
          <div style="font-size:11px;color:var(--text-dim);">OPA</div>
        </div>
      </div>
    ` : '';

    // Application list
    const applicationsHtml = filteredApps.slice(0, 15).map(app => {
      const color = getCategoryColor(app.category);
      const label = getCategoryLabel(app.category);

      return `
        <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:6px;margin-bottom:6px;border-left:3px solid ${color};">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:500;color:var(--text);font-size:13px;margin-bottom:2px;">
                ${escapeHtml(app.application_number || 'N/A')}
              </div>
              <div style="font-size:12px;color:var(--text);margin-bottom:2px;">
                ${escapeHtml(app.property_address || 'Unknown address')}
              </div>
              <div style="font-size:11px;color:var(--text-dim);margin-bottom:2px;">
                ${escapeHtml(app.application_type || 'Unknown type')}
              </div>
              ${app.description ? `
                <div style="font-size:11px;color:var(--text-dim);font-style:italic;margin-top:4px;line-height:1.3;">
                  ${escapeHtml(app.description)}
                </div>
              ` : ''}
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:12px;font-weight:600;color:${color};margin-bottom:2px;">
                ${label}
              </div>
              <div style="font-size:11px;color:var(--text-dim);">
                ${app.application_date || 'Unknown date'}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.content.innerHTML = `
      ${summaryHtml}
      <div style="font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:8px;padding:0 4px;">
        ${this.selectedCategory === 'all' ? 'Recent Applications' : getCategoryLabel(this.selectedCategory as DevelopmentCategory)}
      </div>
      ${applicationsHtml}
      ${filteredApps.length > 15 ? `<small style="display:block;text-align:center;color:var(--text-dim);padding:8px;">Showing 15 of ${filteredApps.length} applications</small>` : ''}
    `;
  }

  public async refresh(): Promise<void> {
    if (this.loading) return;

    const now = Date.now();
    // Only refresh if 6 hours have passed
    if (now - this.lastFetch < 6 * 60 * 60 * 1000) {
      return;
    }

    this.loading = true;
    this.showLoading('Refreshing...');

    try {
      const data = await fetchTorontoDevelopmentData();
      this.lastFetch = now;
      this.setData(data);
    } catch (error) {
      console.error('[Development Pipeline] Refresh failed:', error);
      this.content.innerHTML = `
        <div style="padding:16px;color:var(--text-dim);text-align:center;">
          <p style="margin:0;">Failed to load development data</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:var(--text-dim);">${(error as Error).message}</p>
        </div>
      `;
    } finally {
      this.loading = false;
    }
  }

  public destroy(): void {
    this.categoryButtons.clear();
    super.destroy();
  }
}