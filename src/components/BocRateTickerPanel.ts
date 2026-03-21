import { Panel } from './Panel';
import { toApiUrl } from '@/services/runtime';

interface BocObservation {
  d: string;
  fxUsd: number | null;
  fxEur: number | null;
  overnight: number | null;
}

interface BocRatesData {
  fetchedAt: string;
  observations: BocObservation[];
  latest: {
    date: string;
    fxUsdRate: number | null;
    fxEurRate: number | null;
    overnightRate: number | null;
  };
  rateChanged: boolean;
  previousOvernightRate: number | null;
}

export class BocRateTickerPanel extends Panel {
  private data: BocRatesData | null = null;
  private loading = false;

  constructor() {
    super({
      id: 'boc-rates',
      title: 'BoC Rates',
      infoTooltip: 'Bank of Canada overnight rate and FX rates (CAD/USD, CAD/EUR)',
    });
  }

  public async fetchData(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.showLoading();

    try {
      const resp = await fetch(toApiUrl('/api/boc-rates'), {
        signal: AbortSignal.timeout(20_000),
      });

      if (!resp.ok) {
        this.showError('BoC data unavailable');
        return;
      }

      const result = await resp.json() as BocRatesData;
      this.data = result;

      // Check for overnight rate changes and dispatch breaking news
      if (result.rateChanged && result.latest.overnightRate !== null) {
        this.handleRateChange(result.latest.overnightRate, result.previousOvernightRate);
      }

      this.render();
    } catch (error) {
      console.error('[BocRateTicker] Fetch failed:', error);
      this.showError('Failed to load BoC data');
    } finally {
      this.loading = false;
    }
  }

  private handleRateChange(currentRate: number, previousRate: number | null): void {
    try {
      // Save the new rate
      localStorage.setItem('wm-boc-last-rate', currentRate.toString());

      // Only dispatch if we have a valid previous rate and it changed
      if (previousRate !== null && previousRate !== currentRate) {
        const change = currentRate - previousRate;
        const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'unchanged';
        const pointChange = Math.abs(change * 100).toFixed(2);

        const message = `Bank of Canada overnight rate ${direction} by ${pointChange} basis points to ${(currentRate * 100).toFixed(2)}%`;

        const event = new CustomEvent('breaking-alert', {
          detail: {
            source: 'Bank of Canada',
            message,
            severity: Math.abs(change) > 0.0025 ? 'high' : 'medium',
            timestamp: Date.now(),
          },
        });
        window.dispatchEvent(event);
      }
    } catch (e) {
      console.error('[BocRateTicker] Failed to handle rate change:', e);
    }
  }

  private render(): void {
    if (!this.data) {
      this.showError('No data available');
      return;
    }

    const { latest } = this.data;

    const fxUsdDisplay = latest.fxUsdRate !== null
      ? `<div class="boc-ticker-item">
          <span class="boc-label">CAD/USD</span>
          <span class="boc-value">${latest.fxUsdRate.toFixed(4)}</span>
        </div>`
      : '';

    const fxEurDisplay = latest.fxEurRate !== null
      ? `<div class="boc-ticker-item">
          <span class="boc-label">CAD/EUR</span>
          <span class="boc-value">${latest.fxEurRate.toFixed(4)}</span>
        </div>`
      : '';

    const overnightDisplay = latest.overnightRate !== null
      ? `<div class="boc-ticker-item boc-overnight">
          <span class="boc-label">Overnight Rate</span>
          <span class="boc-value">${(latest.overnightRate * 100).toFixed(2)}%</span>
        </div>`
      : '';

    const rateChangeIndicator = this.data.rateChanged && this.data.previousOvernightRate !== null
      ? `<div class="boc-change-indicator">
          ${latest.overnightRate !== null && this.data.previousOvernightRate !== null
            ? (latest.overnightRate > this.data.previousOvernightRate ? '▲' : latest.overnightRate < this.data.previousOvernightRate ? '▼' : '•')
            : ''
          }
        </div>`
      : '';

    this.setContent(`
      <div class="boc-ticker-container">
        <div class="boc-ticker">
          ${fxUsdDisplay}
          ${fxEurDisplay}
          ${overnightDisplay}
          ${rateChangeIndicator}
        </div>
        <div class="boc-footer">Updated: ${latest.date}</div>
      </div>
    `);
  }
}