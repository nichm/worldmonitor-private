import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';
import type { WaterLevelData } from '@/services/toronto-water-level';
import {
  fetchTorontoWaterLevel,
  getDeviationColor,
  getGaugeValue,
  formatWaterLevel,
  formatDeviation,
  getDeviationStatus,
} from '@/services/toronto-water-level';

export class TorontoWaterLevelPanel extends Panel {
  private data: WaterLevelData | null = null;
  private loading = false;
  private lastFetch = 0;

  constructor() {
    super({
      id: 'toronto-water-level',
      title: 'Lake Ontario Water Level',
      showCount: false,
      trackActivity: false,
      infoTooltip: 'Lake Ontario/Toronto Harbour water level monitoring from DFO Integrated Water Level System. Shows current observed level, predicted level, and deviation. Alerts on surge > 0.3m.',
      defaultRowSpan: 1,
    });

    this.showLoading('Loading water level data...');
  }

  public setData(waterData: WaterLevelData): void {
    this.data = waterData;
    this.render();
  }

  private render(): void {
    if (!this.data) {
      replaceChildren(this.content,
        h('div', { className: 'empty-state' },
          h('p', {}, 'No data available')
        )
      );
      return;
    }

    if (this.data.error) {
      replaceChildren(this.content,
        h('div', { className: 'empty-state error' },
          h('p', {}, this.data.message || 'Failed to load water level data'),
        )
      );
      return;
    }

    const { currentReading, predictedReading, deviation, deviationThreshold } = this.data;

    // Create gauge
    const currentValue = currentReading?.value ?? null;
    const predictedValue = predictedReading?.value ?? null;

    const deviationColor = getDeviationColor(deviation, deviationThreshold);
    const deviationStatus = getDeviationStatus(deviation, deviationThreshold);
    const isSurge = deviation !== null && Math.abs(deviation) > deviationThreshold;

    replaceChildren(this.content,
      h('div', { className: 'water-level-container' },
        // Current vs Predicted row
        h('div', { className: 'water-level-readings' },
          h('div', { className: 'water-level-reading-group' },
            h('div', { className: 'water-level-label' }, 'Current'),
            h('div', { className: 'water-level-value' }, formatWaterLevel(currentValue)),
            currentReading?.isQualityControlled
              ? h('div', { className: 'water-level-qc qc-good' }, 'QC Verified')
              : h('div', { className: 'water-level-qc qc-pending' }, 'Pending QC'),
          ),
          h('div', { className: 'water-level-reading-group predictive' },
            h('div', { className: 'water-level-label' }, 'Predicted'),
            h('div', { className: 'water-level-value' }, formatWaterLevel(predictedValue)),
          ),
        ),

        // Deviation indicator
        h('div', {
          className: `water-level-deviation ${isSurge ? 'surge-alert' : ''}`,
          style: `border-color: rgb(${deviationColor.join(',')})`,
        },
          h('div', { className: 'deviation-label' }, 'Deviation'),
          h('div', { className: 'deviation-value' }, formatDeviation(deviation)),
          h('div', {
            className: 'deviation-status',
            style: `color: rgb(${deviationColor.join(',')})`,
          }, deviationStatus),
        ),

        // Gauge
        h('div', { className: 'water-level-gauge-container' },
          h('div', { className: 'water-level-gauge' },
            h('div', {
              className: 'water-level-gauge-fill',
              style: `width: ${getGaugeValue(currentValue)}%`,
            }),
            h('div', { className: 'water-level-gauge-label' },
              getGaugeValue(currentValue).toFixed(0) + '%'
            ),
          ),
          h('div', { className: 'water-level-gauge-scale' },
            h('span', {}, '74.0m'),
            h('span', {}, '75.5m'),
          ),
        ),

        // Timestamp
        h('div', { className: 'water-level-timestamp' },
          `Updated: ${currentReading?.timestamp
            ? new Date(currentReading.timestamp).toLocaleString()
            : 'N/A'}`
        ),
      )
    );
  }

  public async refresh(): Promise<void> {
    if (this.loading) return;

    const now = Date.now();
    // Only refresh if 1 hour has passed (matching cache TTL)
    if (now - this.lastFetch < 60 * 60 * 1000) {
      return;
    }

    this.loading = true;
    this.showLoading('Refreshing...');

    try {
      const data = await fetchTorontoWaterLevel();
      this.lastFetch = now;
      this.setData(data);
    } catch (error) {
      console.error('[Water Level] Refresh failed:', error);
      replaceChildren(this.content,
        h('div', { className: 'empty-state error' },
          h('p', {}, 'Failed to load water level data'),
          h('p', { className: 'error-message' }, (error as Error).message)
        )
      );
    } finally {
      this.loading = false;
    }
  }
}