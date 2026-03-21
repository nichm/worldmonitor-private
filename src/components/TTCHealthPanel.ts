import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';
import {
  fetchTtcHealth,
  getHealthColor,
  getHealthPercentage,
  type TtcHealthResponse,
  type TtcDelayMetrics,
} from '@/services/ttc-health';

export class TTCHealthPanel extends Panel {
  private data: TtcHealthResponse | null = null;
  private loading = false;
  private lastFetch = 0;

  constructor() {
    super({
      id: 'ttc-health',
      title: 'TTC System Health',
      showCount: false,
      trackActivity: true,
      infoTooltip: 'Toronto Transit Commission system health metrics over the last 30 days. Shows delay statistics for bus, streetcar, and subway modes with colour-coded health status.',
      defaultRowSpan: 2,
    });

    this.showLoading('Loading TTC data...');
    this.loadData();
  }

  private async loadData(): Promise<void> {
    if (this.loading) return;

    const now = Date.now();
    // Only refresh if 12 hours have passed
    if (now - this.lastFetch < 12 * 60 * 60 * 1000 && this.data) {
      this.render();
      return;
    }

    this.loading = true;
    this.showLoading('Refreshing...');

    try {
      const data = await fetchTtcHealth();
      this.lastFetch = now;
      this.data = data;
      this.render();
    } catch (error) {
      console.error('[TTC Health] Load failed:', error);
      replaceChildren(this.content,
        h('div', { className: 'empty-state error' },
          h('p', {}, 'Failed to load TTC data'),
          h('p', { className: 'error-message' }, (error as Error).message)
        )
      );
    } finally {
      this.loading = false;
    }
  }

  private render(): void {
    if (!this.data || !this.data.summary) {
      replaceChildren(this.content,
        h('div', { className: 'empty-state' },
          h('p', {}, 'No TTC data available')
        )
      );
      return;
    }

    const summary = this.data.summary;
    const healthScore = this.data.health_score;

    replaceChildren(this.content,
      h('div', { className: 'ttc-health-panel' },
        this.renderOverallHealth(healthScore),
        h('div', { className: 'ttc-modes' },
          this.renderModeCard('Bus', summary.bus, '🚌'),
          this.renderModeCard('Streetcar', summary.streetcar, '🚋'),
          this.renderModeCard('Subway', summary.subway, '🚇'),
        ),
        h('div', { className: 'ttc-health-meta' },
          h('span', { className: 'ttc-health-period' },
            `Last ${this.data.period_days} days`
          ),
          h('span', { className: 'ttc-health-source' }, 'Source: City of Toronto Open Data'),
        ),
      )
    );
  }

  private renderOverallHealth(health: any): HTMLElement {
    const colorClass = health.overall_color;
    const color = getHealthColor(colorClass);
    const percentage = getHealthPercentage(colorClass);
    const label = colorClass === 'green' ? 'Good' : colorClass === 'amber' ? 'Fair' : 'Poor';

    return h('div', { className: 'ttc-overall-health' },
      h('div', { className: 'ttc-health-header' },
        h('span', { className: 'ttc-health-title' }, 'Overall System Health'),
        h('span', {
          className: `ttc-health-badge ttc-health-badge-${colorClass}`,
          style: `background-color: ${color}`,
        }, label),
      ),
      h('div', { className: 'ttc-health-chart' },
        h('div', { className: 'ttc-health-bar-container' },
          h('div', {
            className: `ttc-health-bar ttc-health-bar-${colorClass}`,
            style: `width: ${percentage}%; background-color: ${color}`,
          }),
        ),
        h('div', { className: 'ttc-health-legend' },
          h('span', { className: 'ttc-health-legend-item' },
            h('span', { className: 'ttc-dot ttc-dot-green' }),
            '< 3 min'
          ),
          h('span', { className: 'ttc-health-legend-item' },
            h('span', { className: 'ttc-dot ttc-dot-amber' }),
            '3-8 min'
          ),
          h('span', { className: 'ttc-health-legend-item' },
            h('span', { className: 'ttc-dot ttc-dot-red' }),
            '> 8 min'
          ),
        ),
      ),
      h('div', { className: 'ttc-health-summary' },
        h('span', { className: 'ttc-health-stat' },
          h('span', { className: 'ttc-health-stat-label' }, '30-Day Incidents:'),
          ' ',
          h('strong', {}, String(health.total_incidents)),
        ),
        health.weighted_avg_delay !== null
          ? h('span', { className: 'ttc-health-stat' },
              h('span', { className: 'ttc-health-stat-label' }, 'Weighted Avg Delay:'),
              ' ',
              h('strong', {}, `${health.weighted_avg_delay.toFixed(1)} min`)
            )
          : null,
      ),
    );
  }

  private renderModeCard(mode: string, metrics: TtcDelayMetrics, icon: string): HTMLElement {
    const colorClass = metrics.health_color;
    const color = getHealthColor(colorClass);

    return h('div', {
      className: `ttc-mode-card ttc-mode-card-${colorClass}`,
    },
      h('div', { className: 'ttc-mode-header' },
        h('span', { className: 'ttc-mode-icon' }, icon),
        h('span', { className: 'ttc-mode-name' }, mode),
        h('span', {
          className: `ttc-mode-status ttc-mode-status-${colorClass}`,
          style: `background-color: ${color}`,
        }, colorClass.toUpperCase()),
      ),
      h('div', { className: 'ttc-mode-metrics' },
        this.renderModeMetric('Incidents', metrics.total_incidents),
        metrics.avg_delay_minutes !== null
          ? this.renderModeMetric('Avg Delay', `${metrics.avg_delay_minutes.toFixed(1)} min`)
          : null,
        metrics.p95_delay_minutes !== null
          ? this.renderModeMetric('P95 Delay', `${metrics.p95_delay_minutes.toFixed(1)} min`)
          : null,
      ),
      metrics.avg_delay_minutes !== null
        ? h('div', { className: 'ttc-mode-delay-bar' },
            h('div', {
              className: 'ttc-mode-delay-fill',
              style: `width: ${Math.min((metrics.avg_delay_minutes / 15) * 100, 100)}%; background-color: ${color}`,
            }),
          )
        : null,
    );
  }

  private renderModeMetric(label: string, value: string | number): HTMLElement {
    return h('div', { className: 'ttc-mode-metric' },
      h('span', { className: 'ttc-mode-metric-label' }, label),
      h('span', { className: 'ttc-mode-metric-value' }, String(value)),
    );
  }

  public async refresh(): Promise<void> {
    await this.loadData();
  }

  public destroy(): void {
    super.destroy();
  }
}