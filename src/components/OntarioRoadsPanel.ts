import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import { formatTime } from '@/utils';
import {
  fetchOntarioRoads,
  onOntarioRoadsUpdate,
  startOntarioRoadsPolling,
  stopOntarioRoadsPolling,
  type OntarioRoadsResponse,
  type OntarioRoadIncident,
} from '@/services/ontario-roads';

const SEVERITY_COLORS: Record<string, string> = {
  'CRITICAL': 'var(--threat-critical)',
  'MAJOR': 'var(--threat-high)',
  'MODERATE': 'var(--threat-medium)',
  'MINOR': 'var(--threat-low)',
  'UNKNOWN': 'var(--text-dim)',
};

type SeverityFilter = 'all' | 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR';
type HighwayFilter = 'all' | '400' | '401' | '403' | '404' | '407' | '427' | 'QEW';

export class OntarioRoadsPanel extends Panel {
  private response: OntarioRoadsResponse | null = null;
  private severityFilter: SeverityFilter = 'all';
  private highwayFilter: HighwayFilter = 'all';
  private filterControls: HTMLElement | null = null;

  constructor() {
    super({
      id: 'ontario-roads',
      title: 'Ontario Highways',
      showCount: true,
      trackActivity: true,
      infoTooltip: 'Live highway incidents from Ontario 511 for the Greater Toronto Area',
    });

    this.showLoading('Loading highway incidents...');
    this.setupEventListeners();
    this.loadData();
  }

  private setupEventListeners(): void {
    onOntarioRoadsUpdate((data) => {
      this.response = data;
      this.render();
    });

    startOntarioRoadsPolling();
  }

  private async loadData(): Promise<void> {
    try {
      const data = await fetchOntarioRoads();
      this.response = data;
      this.render();
    } catch (error) {
      console.error('[OntarioRoadsPanel] Failed to load data:', error);
      this.showError('Failed to load highway incidents', () => this.loadData());
    }
  }

  private createFilterControls(): string {
    const severities: Array<{ value: SeverityFilter; label: string }> = [
      { value: 'all', label: 'All' },
      { value: 'CRITICAL', label: 'Critical' },
      { value: 'MAJOR', label: 'Major' },
      { value: 'MODERATE', label: 'Moderate' },
      { value: 'MINOR', label: 'Minor' },
    ];

    const highways: Array<{ value: HighwayFilter; label: string }> = [
      { value: 'all', label: 'All Highways' },
      { value: '400', label: 'Hwy 400' },
      { value: '401', label: 'Hwy 401' },
      { value: '403', label: 'Hwy 403' },
      { value: '404', label: 'Hwy 404' },
      { value: '407', label: 'Hwy 407' },
      { value: '427', label: 'Hwy 427' },
      { value: 'QEW', label: 'QEW' },
    ];

    return `
      <div class="ontario-roads-filters">
        <div class="filter-group">
          <label>Severity:</label>
          <select class="severity-filter" data-filter="severity">
            ${severities.map(s => `
              <option value="${s.value}" ${this.severityFilter === s.value ? 'selected' : ''}>${s.label}</option>
            `).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Highway:</label>
          <select class="highway-filter" data-filter="highway">
            ${highways.map(h => `
              <option value="${h.value}" ${this.highwayFilter === h.value ? 'selected' : ''}>${h.label}</option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  }

  private bindFilterEvents(): void {
    if (!this.filterControls) return;

    const severitySelect = this.filterControls.querySelector('.severity-filter') as HTMLSelectElement;
    const highwaySelect = this.filterControls.querySelector('.highway-filter') as HTMLSelectElement;

    const handleFilterChange = () => {
      if (severitySelect) {
        this.severityFilter = severitySelect.value as SeverityFilter;
      }
      if (highwaySelect) {
        this.highwayFilter = highwaySelect.value as HighwayFilter;
      }
      this.render();
    };

    if (severitySelect) {
      severitySelect.addEventListener('change', handleFilterChange);
    }
    if (highwaySelect) {
      highwaySelect.addEventListener('change', handleFilterChange);
    }
  }

  private formatTimeSince(startTime: string): string {
    try {
      const start = new Date(startTime).getTime();
      if (!Number.isFinite(start)) return '';
      const diff = Date.now() - start;
      if (diff < 60_000) return 'just now';
      const mins = Math.floor(diff / 60_000);
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  }

  private filterIncidents(incidents: OntarioRoadIncident[]): OntarioRoadIncident[] {
    let filtered = incidents;

    if (this.severityFilter !== 'all') {
      filtered = filtered.filter(inc => inc.severity === this.severityFilter);
    }

    if (this.highwayFilter !== 'all') {
      filtered = filtered.filter(inc => {
        const name = inc.roadName.toUpperCase();
        return name.includes(`HWY-${this.highwayFilter}`) || name.includes(this.highwayFilter);
      });
    }

    return filtered;
  }

  private groupIncidentsByHighway(incidents: OntarioRoadIncident[]): Map<string, OntarioRoadIncident[]> {
    const groups = new Map<string, OntarioRoadIncident[]>();

    for (const incident of incidents) {
      const name = incident.roadName.toUpperCase();
      let highway = 'OTHER';

      for (const hw of ['400', '401', '403', '404', '407', '427', 'QEW']) {
        if (name.includes(`HWY-${hw}`) || name.includes(hw)) {
          highway = hw;
          break;
        }
      }

      if (!groups.has(highway)) {
        groups.set(highway, []);
      }
      groups.get(highway)!.push(incident);
    }

    return groups;
  }

  private renderIncident(incident: OntarioRoadIncident): string {
    const severityColor = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS['UNKNOWN'];
    const severityClass = incident.severity.toLowerCase();
    const timeSince = this.formatTimeSince(incident.startTime);

    const locationInfo = incident.county ? `<span class="incident-location">${escapeHtml(incident.county)}</span>` : '';

    return `
      <div class="ontario-incident" data-severity="${severityClass}">
        <div class="incident-header">
          <span class="incident-severity" style="color: ${severityColor}">${incident.severity}</span>
          <span class="incident-time">${timeSince}</span>
        </div>
        <div class="incident-description">${escapeHtml(incident.description || incident.type || 'Incident')}</div>
        ${locationInfo ? `<div class="incident-meta">${locationInfo}</div>` : ''}
      </div>
    `;
  }

  private render(): void {
    if (!this.response || !this.response.incidents) {
      this.setContent(`
        <div class="panel-empty">No highway incidents</div>
      `);
      this.setCount(0);
      return;
    }

    const filtered = this.filterIncidents(this.response.incidents);
    this.setCount(filtered.length);

    if (filtered.length === 0) {
      this.setContent(`
        ${this.createFilterControls()}
        <div class="panel-empty">No incidents match current filters</div>
      `);
      this.filterControls = this.content.querySelector('.ontario-roads-filters');
      this.bindFilterEvents();
      return;
    }

    const groups = this.groupIncidentsByHighway(filtered);
    const highwayOrder = ['400', '401', '403', '404', '407', '427', 'QEW', 'OTHER'];

    const html = `
      ${this.createFilterControls()}
      <div class="ontario-roads-content">
        ${[...groups.entries()]
          .sort((a, b) => {
            const idxA = highwayOrder.indexOf(a[0]);
            const idxB = highwayOrder.indexOf(b[0]);
            const orderA = idxA === -1 ? 999 : idxA;
            const orderB = idxB === -1 ? 999 : idxB;
            return orderA - orderB;
          })
          .map(([highway, incidents]) => {
            const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
            const majorCount = incidents.filter(i => i.severity === 'MAJOR').length;

            return `
              <div class="highway-group">
                <div class="highway-header">
                  <span class="highway-name">Highway ${highway}</span>
                  <span class="highway-count">${incidents.length} incident${incidents.length !== 1 ? 's' : ''}</span>
                  ${criticalCount > 0 ? `<span class="highway-badge critical">${criticalCount} critical</span>` : ''}
                  ${majorCount > 0 ? `<span class="highway-badge major">${majorCount} major</span>` : ''}
                </div>
                <div class="highway-incidents">
                  ${incidents.map(inc => this.renderIncident(inc)).join('')}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
      <div class="panel-footer">
        <span class="panel-source">Ontario 511</span>
        <span class="panel-updated">Updated ${formatTime(new Date(this.response.timestamp))}</span>
      </div>
    `;

    this.setContent(html);
    this.filterControls = this.content.querySelector('.ontario-roads-filters');
    this.bindFilterEvents();
  }

  public override destroy(): void {
    stopOntarioRoadsPolling();
    super.destroy();
  }
}