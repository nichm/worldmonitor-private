import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';
import {
  fetchStatCanToronto,
  getCpiIndicator,
  getUnemploymentIndicator,
  getNhpiIndicator,
  type StatCanIndicator,
} from '@/services/statcan-toronto';

export class StatCanPanel extends Panel {
  private data: any = null;
  private loading = false;
  private lastFetch = 0;

  constructor() {
    super({
      id: 'statcan-toronto',
      title: 'Statistics Canada',
      showCount: false,
      trackActivity: true,
      infoTooltip: 'Canadian economic indicators from Statistics Canada. Tracks CPI, employment, unemployment, and new housing prices for Toronto and Canada.',
      defaultRowSpan: 2,
    });

    this.showLoading('Loading economic data...');
    this.loadData();
  }

  private async loadData(): Promise<void> {
    if (this.loading) return;

    const now = Date.now();
    // Only refresh if 24 hours have passed
    if (now - this.lastFetch < 24 * 60 * 60 * 1000 && this.data) {
      this.render();
      return;
    }

    this.loading = true;
    this.showLoading('Refreshing...');

    try {
      const data = await fetchStatCanToronto();
      this.lastFetch = now;
      this.data = data;
      this.render();
    } catch (error) {
      console.error('[StatCan] Load failed:', error);
      replaceChildren(this.content,
        h('div', { className: 'empty-state error' },
          h('p', {}, 'Failed to load economic data'),
          h('p', { className: 'error-message' }, (error as Error).message)
        )
      );
    } finally {
      this.loading = false;
    }
  }

  private render(): void {
    if (!this.data || !this.data.indicators || this.data.indicators.length === 0) {
      replaceChildren(this.content,
        h('div', { className: 'empty-state' },
          h('p', {}, 'No economic data available')
        )
      );
      return;
    }

    const cpi = getCpiIndicator(this.data);
    const unemployment = getUnemploymentIndicator(this.data);
    const nhpi = getNhpiIndicator(this.data);

    replaceChildren(this.content,
      h('div', { className: 'statcan-panel' },
        h('div', { className: 'statcan-section' },
          h('h3', { className: 'statcan-section-title' }, 'Toronto inflation'),
          cpi ? this.renderIndicator(cpi, 'index') : this.renderNotAvailable('CPI'),
          nhpi ? this.renderIndicator(nhpi, 'index') : null,
        ),
        h('div', { className: 'statcan-section' },
          h('h3', { className: 'statcan-section-title' }, 'Canada employment'),
          unemployment ? this.renderIndicator(unemployment, 'percent') : this.renderNotAvailable('Unemployment'),
        ),
        h('div', { className: 'statcan-meta' },
          h('span', { className: 'statcan-updated' },
            `Updated: ${this.formatPeriod(this.data.indicators[0]?.latest_period)}`
          ),
          h('span', { className: 'statcan-source' }, 'Source: Statistics Canada'),
        ),
      )
    );
  }

  private renderIndicator(indicator: StatCanIndicator, _type: 'index' | 'percent'): HTMLElement {
    const name = indicator.name;
    const value = indicator.latest_value;
    const momChange = indicator.mom_change;
    const yoyChange = indicator.yoy_change;
    const sparkline = indicator.sparkline || [];

    const changeClass = momChange !== null
      ? (momChange > 0 ? 'positive' : momChange < 0 ? 'negative' : 'neutral')
      : 'neutral';

    const changeIcon = momChange !== null
      ? (momChange > 0 ? '↑' : momChange < 0 ? '↓' : '→')
      : '→';

    return h('div', { className: 'statcan-indicator' },
      h('div', { className: 'statcan-indicator-header' },
        h('span', { className: 'statcan-indicator-name' }, name.split(' (')[0]),
        h('span', { className: 'statcan-indicator-value' },
          value !== null ? `${value.toFixed(1)}` : 'N/A'
        ),
      ),
      h('div', { className: 'statcan-indicator-changes' },
        momChange !== null
          ? h('span', { className: `statcan-change statcan-mom ${changeClass}` },
              `${changeIcon} ${Math.abs(momChange).toFixed(2)}% MoM`
            )
          : null,
        yoyChange !== null
          ? h('span', { className: `statcan-change statcan-yoy ${changeClass}` },
              `${changeIcon} ${Math.abs(yoyChange).toFixed(2)}% YoY`
            )
          : null,
      ),
      sparkline.length > 0
        ? h('div', { className: 'statcan-sparkline' },
            ...this.renderSparkline(sparkline, _type)
          )
        : null,
    );
  }

  private renderSparkline(points: any[], _type: 'index' | 'percent'): HTMLElement[] {
    if (points.length < 2) return [];

    const values = points.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const strokeWidth = 2;
    const height = 30;
    const width = 200;
    const step = width / (points.length - 1);

    const pathData = points.map((p, i) => {
      const x = i * step;
      const normalizedValue = (p.value - min) / range;
      const y = height - (normalizedValue * height);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const svg = h('svg', {
      className: 'statcan-sparkline-svg',
      width: String(width),
      height: String(height),
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'none',
    },
      h('path', {
        className: 'statcan-sparkline-path',
        d: pathData,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: String(strokeWidth),
      })
    );

    return [svg];
  }

  private renderNotAvailable(name: string): HTMLElement {
    return h('div', { className: 'statcan-indicator statcan-na' },
      h('div', { className: 'statcan-indicator-header' },
        h('span', { className: 'statcan-indicator-name' }, name),
        h('span', { className: 'statcan-indicator-value' }, 'N/A'),
      ),
      h('div', { className: 'statcan-indicator-changes' },
        h('span', { className: 'statcan-change statcan-neutral' }, 'Data not available'),
      ),
    );
  }

  private formatPeriod(period: string | null): string {
    if (!period || period.length < 6) return 'Unknown';

    const year = period.slice(0, 4);
    const month = parseInt(period.slice(4, 6), 10);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    return `${monthNames[month - 1]} ${year}`;
  }

  public async refresh(): Promise<void> {
    await this.loadData();
  }

  public destroy(): void {
    super.destroy();
  }
}