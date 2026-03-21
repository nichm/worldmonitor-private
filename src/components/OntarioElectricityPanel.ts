import { Panel } from './Panel';
import type { OntarioElectricityData } from '@/services/ontario-electricity';
import {
  fetchOntarioElectricityData,
  getSignalDescription,
} from '@/services/ontario-electricity';

export class OntarioElectricityPanel extends Panel {
  private data: OntarioElectricityData | null = null;
  private loading = false;
  private lastFetch = 0;

  constructor() {
    super({
      id: 'ontario-electricity',
      title: 'Ontario Electricity',
      showCount: false,
      trackActivity: false,
      infoTooltip: 'Real-time Ontario electricity price and demand from IESO. Alerts when price exceeds $150/MWh. Signals: Surplus (<$20), Normal ($20-80), Elevated ($80-150), High ($150-300), Crisis (>$300).',
      defaultRowSpan: 1,
    });
    this.showLoading('Loading electricity data...');
  }

  public setData(data: OntarioElectricityData): void {
    this.data = data;
    this.renderContent();
  }

  private getSignalColor(signal: string): string {
    switch (signal) {
      case 'surplus':
        return 'var(--success-color)';
      case 'normal':
        return 'var(--text)';
      case 'elevated':
        return 'var(--warning-color)';
      case 'high':
        return 'var(--danger-color)';
      case 'crisis':
        return '#ff0000';
      default:
        return 'var(--text-dim)';
    }
  }

  private getSignalEmoji(signal: string): string {
    switch (signal) {
      case 'surplus':
        return '📉';
      case 'normal':
        return '⚡';
      case 'elevated':
        return '⚠️';
      case 'high':
        return '🔴';
      case 'crisis':
        return '🚨';
      default:
        return '•';
    }
  }

  private renderContent(): void {
    if (!this.data || !this.data.price) {
      this.content.innerHTML = `
        <div style="padding:16px;color:var(--text-dim);text-align:center;">
          <p style="margin:0;">No electricity data available</p>
          <small style="font-size:12px;color:var(--text-dim);margin-top:4px;display:block;">IESO real-time data may be temporarily unavailable</small>
        </div>
      `;
      return;
    }

    const { price, demand, signals } = this.data;
    const signalColor = this.getSignalColor(price.signal);
    const signalEmoji = this.getSignalEmoji(price.signal);
    const signalDesc = getSignalDescription(price.signal);

    // Price display
    const priceHtml = `
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:16px;background:var(--bg-elevated);border-radius:8px;margin-bottom:12px;">
        <div style="font-size:32px;">${signalEmoji}</div>
        <div style="text-align:center;">
          <div style="font-size:28px;font-weight:700;color:${signalColor};">$${price.current.toFixed(2)}/MWh</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:2px;">${signalDesc}</div>
        </div>
      </div>
    `;

    // Demand display
    const demandHtml = demand.total > 0 ? `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--bg-elevated);border-radius:6px;margin-bottom:12px;">
        <div style="font-size:13px;color:var(--text-dim);">Total Demand</div>
        <div style="font-size:18px;font-weight:600;color:var(--text);">${demand.total.toLocaleString()} MW</div>
      </div>
    ` : '';

    // Signal indicators
    const signalsHtml = `
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:12px;">
        ${signals.surplus ? `
          <div style="text-align:center;padding:6px;background:var(--success-color);border-radius:4px;">
            <div style="font-size:10px;color:white;font-weight:600;">SURPLUS</div>
            <div style="font-size:9px;color:white;"><$20</div>
          </div>
        ` : ''}
        ${signals.normal ? `
          <div style="text-align:center;padding:6px;background:var(--text);border-radius:4px;">
            <div style="font-size:10px;color:white;font-weight:600;">NORMAL</div>
            <div style="font-size:9px;color:white;">$20-80</div>
          </div>
        ` : ''}
        ${signals.elevated ? `
          <div style="text-align:center;padding:6px;background:var(--warning-color);border-radius:4px;">
            <div style="font-size:10px;color:white;font-weight:600;">ELEVATED</div>
            <div style="font-size:9px;color:white;">$80-150</div>
          </div>
        ` : ''}
        ${signals.high ? `
          <div style="text-align:center;padding:6px;background:var(--danger-color);border-radius:4px;">
            <div style="font-size:10px;color:white;font-weight:600;">HIGH</div>
            <div style="font-size:9px;color:white;">$150-300</div>
          </div>
        ` : ''}
        ${signals.crisis ? `
          <div style="text-align:center;padding:6px;background:#ff0000;border-radius:4px;">
            <div style="font-size:10px;color:white;font-weight:600;">CRISIS</div>
            <div style="font-size:9px;color:white;">>$300</div>
          </div>
        ` : ''}
      </div>
    `;

    // Timestamp
    const timestampHtml = price.timestamp ? `
      <div style="font-size:11px;color:var(--text-dim);text-align:center;">
        Updated: ${price.timestamp}
      </div>
    ` : '';

    // Alert banner if price is high
    const alertHtml = price.current > 150 ? `
      <div style="padding:10px;background:rgba(255,0,0,0.1);border:1px solid var(--danger-color);border-radius:6px;margin-bottom:12px;text-align:center;">
        <div style="font-size:12px;font-weight:600;color:var(--danger-color);">⚠ HIGH PRICE ALERT</div>
        <div style="font-size:11px;color:var(--danger-color);margin-top:2px;">Electricity price above $150/MWh threshold</div>
      </div>
    ` : '';

    this.content.innerHTML = `
      ${alertHtml}
      ${priceHtml}
      ${demandHtml}
      ${signalsHtml}
      ${timestampHtml}
    `;
  }

  public async refresh(): Promise<void> {
    if (this.loading) return;

    const now = Date.now();
    // Only refresh if 5 minutes have passed
    if (now - this.lastFetch < 5 * 60 * 1000) {
      return;
    }

    this.loading = true;
    this.showLoading('Refreshing...');

    try {
      const data = await fetchOntarioElectricityData();
      this.lastFetch = now;
      this.setData(data);
    } catch (error) {
      console.error('[Ontario Electricity] Refresh failed:', error);
      this.content.innerHTML = `
        <div style="padding:16px;color:var(--text-dim);text-align:center;">
          <p style="margin:0;">Failed to load electricity data</p>
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