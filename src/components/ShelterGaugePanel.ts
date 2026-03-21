import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import {
  fetchTorontoShelter,
  type ShelterGaugeData,
  getOccupancyColor,
  getOccupancyLabel,
  formatOccupancyMessage,
  shouldBreakNews,
} from '@/services/toronto-shelter';

const SETTINGS_KEY = 'wm-shelter-gauge-v1';

interface PanelSettings {
  lastDailyUpdate: string; // ISO date, update once per day
  cachedData: ShelterGaugeData | null;
}

function loadSettings(): PanelSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0]!;
      // Reset if it's a new day
      if (parsed.lastDailyUpdate && parsed.lastDailyUpdate !== today) {
        return { lastDailyUpdate: today, cachedData: null };
      }
      return parsed;
    }
  } catch {}
  return { lastDailyUpdate: new Date().toISOString().split('T')[0]!, cachedData: null };
}

function saveSettings(s: PanelSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

export class ShelterGaugePanel extends Panel {
  private settings: PanelSettings = loadSettings();
  private loading = false;

  constructor() {
    super({
      id: 'shelter-gauge',
      title: 'Toronto Shelter Capacity',
      defaultRowSpan: 2,
      infoTooltip: 'Daily shelter system occupancy. Citywide and sector breakdown.',
    });
  }

  public async fetchData(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.showLoading();

    try {
      const data = await fetchTorontoShelter();

      if (!data) {
        this.showError('Shelter data unavailable');
        return;
      }

      // Update cached data
      this.settings.cachedData = data;
      this.settings.lastDailyUpdate = new Date().toISOString().split('T')[0]!;
      saveSettings(this.settings);

      // Check for breaking news
      if (shouldBreakNews(data)) {
        this.dispatchBreakingAlert(formatOccupancyMessage(data));
      }

      this.render();
    } catch (error) {
      console.error('[ShelterGauge] Fetch failed:', error);
      this.showError('Failed to load shelter data');
    } finally {
      this.loading = false;
    }
  }

  private dispatchBreakingAlert(message: string): void {
    try {
      const event = new CustomEvent('breaking-alert', {
        detail: {
          source: 'Toronto Shelter System',
          message,
          severity: 'high',
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error('[ShelterGauge] Failed to dispatch breaking alert:', e);
    }
  }

  private render(): void {
    const data = this.settings.cachedData;
    if (!data) {
      this.showError('No data available');
      return;
    }

    const cityColor = getOccupancyColor(data.citywide.occupancy);
    const cityLabel = getOccupancyLabel(data.citywide.occupancy);

    const sectorsHtml = data.sectors
      .sort((a, b) => b.occupancy - a.occupancy)
      .map(
        (sector) => `
        <div class="shelter-sector">
          <div class="sector-name">${escapeHtml(sector.sector)}</div>
          <div class="sector-metric">
            <span class="sector-occupancy" style="color: ${getOccupancyColor(sector.occupancy)}">
              ${sector.occupancy}%
            </span>
            <span class="sector-capacity">${sector.occupied}/${sector.capacity}</span>
          </div>
          <div class="sector-bar">
            <div class="sector-fill" style="width: ${sector.occupancy}%; background: ${getOccupancyColor(sector.occupancy)}"></div>
          </div>
        </div>
      `
      )
      .join('');

    this.setContent(`
      <div class="shelter-gauge-container">
        <div class="shelter-gauge">
          <svg viewBox="0 0 200 120" class="gauge-svg">
            <!-- Background arc -->
            <path d="M 20 100 A 80 80 0 1 1 180 100" fill="none" stroke="var(--border)" stroke-width="12"/>
            <!-- Value arc -->
            <path d="M 20 100 A 80 80 0 1 1 180 100" fill="none" stroke="${cityColor}" stroke-width="12"
              stroke-dasharray="${(data.citywide.occupancy / 100) * 251.2} 251.2"
              stroke-linecap="round"/>
            <!-- Value text -->
            <text x="100" y="85" text-anchor="middle" class="gauge-value">${data.citywide.occupancy}%</text>
            <text x="100" y="105" text-anchor="middle" class="gauge-label">${cityLabel}</text>
          </svg>
        </div>
        <div class="shelter-citywide">
          <div class="citywide-label">Citywide Capacity</div>
          <div class="citywide-metric">${data.citywide.occupied} / ${data.citywide.capacity} beds</div>
          <div class="citywide-date">As of ${escapeHtml(data.asOf)}</div>
        </div>
        <div class="shelter-sectors">
          ${sectorsHtml}
        </div>
      </div>
    `);
  }
}