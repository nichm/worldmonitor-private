/**
 * EVChargingPanel -- displays EV charging station data
 * Shows station counts, connector types, and network breakdown for Toronto
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import {
  fetchEVChargingStations,
  getConnectorColor,
  getPrimaryConnectorType,
  type EVChargingData,
  type EVChargingStation,
} from '@/services/ev-charging';

export class EVChargingPanel extends Panel {
  private data: EVChargingData | null = null;
  private loading = false;
  private activeNetworks: Set<string> = new Set();
  private showList = false;

  constructor() {
    super({
      id: 'ev-charging',
      title: 'EV Charging Stations',
      defaultRowSpan: 2,
      infoTooltip: 'EV charging stations in the Toronto area from NREL Alternative Fuel Station data.',
    });

    // Set up event delegation for click handling
    this.element.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-network]') as HTMLElement | null;
      if (target) {
        this.toggleNetwork(target.dataset.network!);
        return;
      }
      if ((e.target as HTMLElement).closest('[data-toggle-list]')) {
        this.showList = !this.showList;
        this.render();
        return;
      }
    });
  }

  public async fetchData(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.showLoading();

    try {
      const result = await fetchEVChargingStations();

      if (!result) {
        this.showError('EV charging data unavailable');
        return;
      }

      this.data = result;
      this.setCount(result.total);
      this.render();
    } catch (error) {
      console.error('[EVChargingPanel] Fetch failed:', error);
      this.showError('Failed to load EV charging data');
    } finally {
      this.loading = false;
    }
  }

  public setData(data: EVChargingData | null): void {
    if (data) {
      this.data = data;
      this.setCount(data.total);
      this.render();
    }
  }

  private toggleNetwork(network: string): void {
    if (this.activeNetworks.has(network)) {
      this.activeNetworks.delete(network);
    } else {
      this.activeNetworks.add(network);
    }
    this.render();
  }

  private getFilteredStations(): EVChargingStation[] {
    if (!this.data) return [];

    const stations = this.data.stations;

    if (this.activeNetworks.size === 0) {
      return stations;
    }

    return stations.filter((station) => {
      return this.activeNetworks.has(station.evNetwork || 'Unknown');
    });
  }

  private render(): void {
    if (!this.data) {
      this.showError('No data available');
      return;
    }

    const totalStations = this.data.stations.length;
    const totalConnectors = Object.values(this.data.connectorTypeCounts).reduce((a, b) => a + b, 0);
    const filteredStations = this.getFilteredStations();
    const topStations = filteredStations.slice(0, 20);

    // Build connector type stats
    const connectorStats = [
      { key: 'Level 2', label: 'Level 2', color: getConnectorColor('Level 2') },
      { key: 'DC Fast', label: 'DC Fast', color: getConnectorColor('DC Fast') },
      { key: 'Level 1', label: 'Level 1', color: getConnectorColor('Level 1') },
      { key: 'Other', label: 'Other', color: getConnectorColor('Other') },
    ];

    const connectorStatsHtml = connectorStats
      .map((stat) => {
        const count = this.data!.connectorTypeCounts[stat.key] || 0;
        return `
          <div class="ev-connector-stat">
            <div class="ev-connector-dot" style="background-color: ${stat.color}"></div>
            <div class="ev-connector-label">${escapeHtml(stat.label)}</div>
            <div class="ev-connector-count">${count}</div>
          </div>
        `;
      })
      .join('');

    // Build network stats (top 8 networks)
    const networkEntries = Object.entries(this.data.networkCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const networkStatsHtml = networkEntries
      .map(([network, count]) => {
        return `
          <div class="ev-network-stat">
            <div class="ev-network-label">${escapeHtml(network)}</div>
            <div class="ev-network-count">${count}</div>
          </div>
        `;
      })
      .join('');

    // Build network filter buttons
    const networkFilterButtonsHtml = networkEntries
      .map(([network]) => {
        const isActive = this.activeNetworks.has(network);
        const activeClass = isActive ? 'active' : '';
        const activeStyle = isActive ? 'background-color: var(--primary-color); color: white;' : '';
        return `
          <button
            class="ev-network-filter-btn ${activeClass}"
            data-network="${escapeHtml(network)}"
            style="${activeStyle}"
          >
            ${escapeHtml(network.length > 15 ? network.substring(0, 15) + '...' : network)}
          </button>
        `;
      })
      .join('');

    // Build top 20 stations list
    const stationsListHtml = topStations
      .map((station) => {
        const primaryType = getPrimaryConnectorType(station);
        const typeColor = getConnectorColor(primaryType);
        const totalConnectors = station.evLevel2EvseNum + station.evDcFastCount +
                                station.evLevel1EvseNum + station.evOtherEvse;
        return `
          <div class="ev-station-list-item">
            <div class="ev-station-list-name">${escapeHtml(station.stationName)}</div>
            <div class="ev-station-list-address">${escapeHtml(station.streetAddress)}</div>
            <div class="ev-station-list-details">
              <span
                class="ev-station-list-connector"
                style="color: ${typeColor}"
              >
                ${escapeHtml(primaryType)} (${totalConnectors})
              </span>
              <span class="ev-station-list-network">${escapeHtml(station.evNetwork || 'Unknown')}</span>
            </div>
          </div>
        `;
      })
      .join('');

    const listToggleHtml = `
      <div class="ev-station-list-toggle" data-toggle-list>
        <button class="ev-toggle-btn">
          ${this.showList ? 'Hide' : 'Show'} Top 20
          <span class="ev-toggle-icon">
            ${this.showList ? '▼' : '▶'}
          </span>
        </button>
      </div>
    `;

    const listHtml = this.showList
      ? `
        <div class="ev-station-list">
          <div class="ev-station-list-header">
            ${filteredStations.length} stations ${this.activeNetworks.size > 0 ? '(filtered)' : ''}
          </div>
          ${stationsListHtml}
        </div>
      `
      : '';

    this.setContent(`
      <div class="ev-container">
        <div class="ev-summary">
          <div class="ev-total">
            <div class="ev-total-label">Stations</div>
            <div class="ev-total-value">${totalStations}</div>
          </div>
          <div class="ev-connectors-total">
            <div class="ev-connectors-total-label">Connectors</div>
            <div class="ev-connectors-total-value">${totalConnectors}</div>
          </div>
        </div>
        <div class="ev-connector-stats">
          ${connectorStatsHtml}
        </div>
        <div class="ev-network-section">
          <div class="ev-network-stats">
            ${networkStatsHtml}
          </div>
          <div class="ev-network-filters">
            ${networkFilterButtonsHtml}
          </div>
        </div>
        ${listToggleHtml}
        ${listHtml}
      </div>
    `);
  }
}