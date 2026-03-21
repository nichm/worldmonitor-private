import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';
import {
  fetchToronto311,
  getHighestStressWard,
  type Toronto311WardStats,
} from '@/services/toronto-311';

export class ThreeElevenPanel extends Panel {
  private data: any = null;
  private loading = false;
  private lastFetch = 0;

  constructor() {
    super({
      id: 'toronto-311',
      title: '311 Service Requests',
      showCount: true,
      trackActivity: true,
      infoTooltip: 'Toronto 311 service request data focused on housing and social distress indicators. Shows high-signal types like shelter crises, encampment reports, and affordable housing requests aggregated by ward.',
      defaultRowSpan: 2,
    });

    this.showLoading('Loading 311 data...');
    this.loadData();
  }

  private async loadData(): Promise<void> {
    if (this.loading) return;

    const now = Date.now();
    // Only refresh if 6 hours have passed
    if (now - this.lastFetch < 6 * 60 * 60 * 1000 && this.data) {
      this.render();
      return;
    }

    this.loading = true;
    this.showLoading('Refreshing...');

    try {
      const data = await fetchToronto311();
      this.lastFetch = now;
      this.data = data;
      this.setCount(data.city_stats?.total_requests || 0);
      this.render();
    } catch (error) {
      console.error('[311] Load failed:', error);
      replaceChildren(this.content,
        h('div', { className: 'empty-state error' },
          h('p', {}, 'Failed to load 311 data'),
          h('p', { className: 'error-message' }, (error as Error).message)
        )
      );
    } finally {
      this.loading = false;
    }
  }

  private render(): void {
    if (!this.data || !this.data.city_stats) {
      replaceChildren(this.content,
        h('div', { className: 'empty-state' },
          h('p', {}, 'No 311 data available')
        )
      );
      return;
    }

    const cityStats = this.data.city_stats;
    const topWards = this.data.top_wards || [];
    const highestStress = getHighestStressWard(this.data);

    replaceChildren(this.content,
      h('div', { className: 'toronto-311-panel' },
        h('div', { className: 'toronto-311-summary' },
          this.renderSummaryItem('7-Day Total', cityStats.total_requests, 'requests'),
          this.renderSummaryItem('Open', cityStats.open_requests, 'open'),
        ),
        highestStress ? this.renderHighestStressWard(highestStress) : null,
        topWards.length > 0 ? this.renderTopWards(topWards) : null,
        h('div', { className: 'toronto-311-meta' },
          h('span', { className: 'toronto-311-period' },
            `Last ${cityStats.period_days} days`
          ),
          h('span', { className: 'toronto-311-source' }, 'Source: City of Toronto Open Data'),
        ),
      )
    );
  }

  private renderSummaryItem(label: string, value: number, suffix: string): HTMLElement {
    return h('div', { className: 'toronto-311-summary-item' },
      h('span', { className: 'toronto-311-summary-label' }, label),
      h('span', { className: 'toronto-311-summary-value' },
        String(value),
        h('span', { className: 'toronto-311-summary-suffix' }, ` ${suffix}`)
      ),
    );
  }

  private renderHighestStressWard(ward: Toronto311WardStats): HTMLElement {
    const stressClass = ward.stress_level === 'high' ? 'high' : ward.stress_level === 'medium' ? 'medium' : 'low';

    return h('div', { className: 'toronto-311-highest-stress' },
      h('h3', { className: 'toronto-311-section-title' }, 'Highest Stress Ward'),
      h('div', { className: 'toronto-311-ward-card' },
        h('div', { className: 'toronto-311-ward-header' },
          h('span', { className: 'toronto-311-ward-name' }, ward.ward),
          h('span', {
            className: `toronto-311-stress-badge toronto-311-stress-${stressClass}`,
          }, `${ward.stress_level} stress`),
        ),
        h('div', { className: 'toronto-311-ward-stats' },
          this.renderWardStat('Total', ward.total_requests),
          this.renderWardStat('Open', ward.open_requests),
        ),
        h('div', { className: 'toronto-311-stress-bar' },
          h('div', {
            className: `toronto-311-stress-fill toronto-311-stress-fill-${stressClass}`,
            style: `width: ${ward.stress_score * 100}%`,
          }),
        ),
        h('div', { className: 'toronto-311-stress-score' },
          `Stress score: ${(ward.stress_score * 100).toFixed(0)}/100`
        ),
      ),
    );
  }

  private renderTopWards(wards: Toronto311WardStats[]): HTMLElement {
    return h('div', { className: 'toronto-311-top-wards' },
      h('h3', { className: 'toronto-311-section-title' }, 'Top Stressed Wards'),
      h('div', { className: 'toronto-311-wards-list' },
        ...wards.map(ward => this.renderWardItem(ward))
      ),
    );
  }

  private renderWardItem(ward: Toronto311WardStats): HTMLElement {
    const stressClass = ward.stress_level === 'high' ? 'high' : ward.stress_level === 'medium' ? 'medium' : 'low';

    // Get top 3 request types
    const topTypes = Object.entries(ward.by_type || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return h('div', { className: 'toronto-311-ward-item' },
      h('div', { className: 'toronto-311-ward-item-header' },
        h('span', { className: 'toronto-311-ward-name' }, ward.ward),
        h('span', { className: 'toronto-311-ward-requests' },
          `${ward.total_requests} requests`
        ),
      ),
      topTypes.length > 0
        ? h('div', { className: 'toronto-311-ward-types' },
            ...topTypes.map(([type, count]) =>
              h('span', { className: 'toronto-311-ward-type' },
                `${type}: ${count}`
              )
            )
          )
        : null,
      h('div', { className: `toronto-311-ward-stress-indicator toronto-311-stress-${stressClass}` },
        `${ward.stress_level} stress (${(ward.stress_score * 100).toFixed(0)})`
      ),
    );
  }

  private renderWardStat(label: string, value: number): HTMLElement {
    return h('div', { className: 'toronto-311-ward-stat' },
      h('span', { className: 'toronto-311-ward-stat-label' }, label),
      h('span', { className: 'toronto-311-ward-stat-value' }, String(value)),
    );
  }

  public async refresh(): Promise<void> {
    await this.loadData();
  }

  public destroy(): void {
    super.destroy();
  }
}