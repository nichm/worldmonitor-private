import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { TorontoCrimeData } from '@/services/toronto-crime';
import { fetchTorontoCrimeStats } from '@/services/toronto-crime';

export class TorontoCrimePanel extends Panel {
  private data: TorontoCrimeData | null = null;
  private loading = false;
  private lastFetch = 0;

  constructor() {
    super({
      id: 'toronto-crime',
      title: 'Toronto Crime Delta',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Year-to-date crime statistics comparing current year vs same period last year. Alerts when Auto Theft YTD delta exceeds +20%.',
      defaultRowSpan: 2,
    });
    this.showLoading('Loading crime stats...');
  }

  public setData(data: TorontoCrimeData): void {
    this.data = data;
    if (data.totals) {
      this.setCount(data.totals.currentYtd);
    }
    this.renderContent();
  }

  private getDeltaColor(delta: number): string {
    if (delta > 0) return 'var(--danger-color)';
    if (delta < 0) return 'var(--success-color)';
    return 'var(--text-dim)';
  }

  private getDeltaArrow(delta: number): string {
    if (delta > 0) return '▲';
    if (delta < 0) return '▼';
    return '—';
  }

  private renderContent(): void {
    if (!this.data || !this.data.categories || this.data.categories.length === 0) {
      this.content.innerHTML = `
        <div style="padding:16px;color:var(--text-dim);text-align:center;">
          <p style="margin:0;">No crime data available</p>
          <small style="font-size:12px;color:var(--text-dim);margin-top:4px;display:block;">Data may not be available yet</small>
        </div>
      `;
      return;
    }

    const { categories, totals, period } = this.data;

    // Total stats summary
    const summaryHtml = totals ? `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${totals.currentYtd}</div>
          <div style="font-size:12px;color:var(--text-dim);">Current YTD</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text-dim);">${totals.lastYearYtd}</div>
          <div style="font-size:12px;color:var(--text-dim);">Last Year YTD</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:${this.getDeltaColor(totals.delta)};">${totals.delta > 0 ? '+' : ''}${totals.delta}</div>
          <div style="font-size:12px;color:var(--text-dim);">Delta</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:${this.getDeltaColor(totals.delta)};">
            ${this.getDeltaArrow(totals.delta)} ${Math.abs(totals.deltaPct).toFixed(1)}%
          </div>
          <div style="font-size:12px;color:var(--text-dim);">Change</div>
        </div>
      </div>
    ` : '';

    // Period info
    const periodHtml = period ? `
      <div style="font-size:11px;color:var(--text-dim);text-align:center;margin-bottom:12px;">
        Comparing ${period.currentYearStart}–${period.currentYearEnd} to ${period.lastYearStart}–${period.lastYearEnd}
      </div>
    ` : '';

    // Category list
    const categoriesHtml = categories.slice(0, 10).map(category => {
      const color = this.getDeltaColor(category.delta);
      const arrow = this.getDeltaArrow(category.delta);

      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg-elevated);border-radius:6px;margin-bottom:6px;border-left:${category.deltaPct > 20 ? '3px solid var(--danger-color)' : 'none'};">
          <div style="flex:1;">
            <div style="font-weight:500;color:var(--text);font-size:13px;">${escapeHtml(category.category)}</div>
            ${category.deltaPct > 20 ? `
              <div style="font-size:11px;color:var(--danger-color);margin-top:2px;">⚠ ALERT: >20% increase</div>
            ` : ''}
          </div>
          <div style="text-align:right;">
            <div style="font-weight:600;color:var(--text);font-size:14px;">${category.currentYtd}</div>
            <div style="font-size:11px;color:var(--text-dim);">vs ${category.lastYearYtd}</div>
          </div>
          <div style="text-align:right;min-width:80px;margin-left:12px;">
            <div style="font-weight:600;color:${color};font-size:14px;">
              ${arrow} ${Math.abs(category.delta)}
            </div>
            <div style="font-size:11px;color:${color};">${arrow} ${Math.abs(category.deltaPct).toFixed(1)}%</div>
          </div>
        </div>
      `;
    }).join('');

    this.content.innerHTML = `
      ${summaryHtml}
      ${periodHtml}
      <div style="font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:8px;padding:0 4px;">By Category</div>
      ${categoriesHtml}
      ${categories.length > 10 ? `<small style="display:block;text-align:center;color:var(--text-dim);padding:8px;">Showing 10 of ${categories.length} categories</small>` : ''}
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
      const data = await fetchTorontoCrimeStats();
      this.lastFetch = now;
      this.setData(data);
    } catch (error) {
      console.error('[Toronto Crime] Refresh failed:', error);
      this.content.innerHTML = `
        <div style="padding:16px;color:var(--text-dim);text-align:center;">
          <p style="margin:0;">Failed to load crime data</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:var(--text-dim);">${(error as Error).message}</p>
        </div>
      `;
    } finally {
      this.loading = false;
    }
  }

  public destroy(): void {
    super.destroy();
  }
}