import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';
import type { TorontoFireIncident } from '@/services/toronto-fire';
import {
  fetchTorontoFireIncidents,
  getIncidentTypes,
  getAlarmColor,
} from '@/services/toronto-fire';

export class TorontoFirePanel extends Panel {
  private incidents: TorontoFireIncident[] = [];
  private filteredIncidents: TorontoFireIncident[] = [];
  private selectedAlarm = 'all';
  private selectedType = 'all';
  private alarmFilterEl: HTMLElement | null = null;
  private typeFilterEl: HTMLElement | null = null;
  private loading = false;
  private lastFetch = 0;
  private incidentTypeButtons: Map<string, HTMLElement> = new Map();

  constructor() {
    super({
      id: 'toronto-fire',
      title: 'Toronto Fire CAD',
      showCount: true,
      trackActivity: true,
      infoTooltip: 'Live Toronto Fire Services CAD (Computer Aided Dispatch) information. Shows active fire and emergency incidents with alarm levels.',
      defaultRowSpan: 2,
    });

    this.createFilters();
    this.showLoading('Loading incidents...');
  }

  private createFilters(): void {
    const filterContainer = h('div', { className: 'toronto-fire-filters' });

    // Alarm level filter
    this.alarmFilterEl = h('div', { className: 'toronto-fire-filter-group' },
      h('label', { className: 'toronto-fire-filter-label' }, 'Alarm Level:'),
      this.createAlarmButtons(),
    );

    // Incident type filter
    this.typeFilterEl = h('div', { className: 'toronto-fire-filter-group' },
      h('label', { className: 'toronto-fire-filter-label' }, 'Incident Type:'),
      h('div', { className: 'toronto-fire-type-buttons' },
        h('button', {
          className: 'toronto-fire-type-btn active',
          dataset: { type: 'all' },
          onClick: () => this.selectType('all'),
        }, 'All'),
      ),
    );

    filterContainer.appendChild(this.alarmFilterEl);
    filterContainer.appendChild(this.typeFilterEl);
    this.element.insertBefore(filterContainer, this.content);
  }

  private createAlarmButtons(): HTMLElement {
    const container = h('div', { className: 'toronto-fire-alarm-buttons' });

    const alarmLevels = [
      { value: 'all', label: 'All' },
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3+' },
      { value: '4', label: '4+' },
      { value: '5', label: '5' },
    ];

    for (const { value, label } of alarmLevels) {
      const button = h('button', {
        className: `toronto-fire-alarm-btn ${value === 'all' ? 'active' : ''}`,
        dataset: { alarm: value },
        onClick: () => this.selectAlarm(value),
      }, label);

      if (value !== 'all') {
        const color = getAlarmColor(parseInt(value, 10));
        // Add a small color indicator
        const indicator = h('span', {
          className: `alarm-indicator alarm-${value}`,
          style: `background-color: rgb(${color.join(',')})`,
        });
        button.appendChild(indicator);
      }

      container.appendChild(button);
    }

    return container;
  }

  private selectAlarm(alarm: string): void {
    if (this.selectedAlarm === alarm) return;

    this.selectedAlarm = alarm;
    this.alarmFilterEl?.querySelectorAll('.toronto-fire-alarm-btn').forEach(btn => {
      const btnEl = btn as HTMLElement;
      btnEl.classList.toggle('active', btnEl.dataset.alarm === alarm);
    });

    this.applyFilters();
  }

  private selectType(type: string): void {
    if (this.selectedType === type) return;

    this.selectedType = type;
    this.incidentTypeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredIncidents = this.incidents.filter(inc => {
      // Filter by alarm level
      if (this.selectedAlarm !== 'all') {
        const alarmLevel = parseInt(this.selectedAlarm, 10);
        if (inc.alarm < alarmLevel) {
          return false;
        }
      }

      // Filter by incident type
      if (this.selectedType !== 'all' && inc.incidentType !== this.selectedType) {
        return false;
      }

      return true;
    });

    this.setCount(this.filteredIncidents.length);
    this.renderIncidents();
  }

  private updateTypeButtons(): void {
    const types = getIncidentTypes(this.incidents);
    const container = this.typeFilterEl?.querySelector('.toronto-fire-type-buttons');

    if (!container) return;

    this.incidentTypeButtons.clear();
    replaceChildren(container,
      h('button', {
        className: `toronto-fire-type-btn ${this.selectedType === 'all' ? 'active' : ''}`,
        dataset: { type: 'all' },
        onClick: () => this.selectType('all'),
      }, 'All'),
      ...types.map(type => {
        const button = h('button', {
          className: `toronto-fire-type-btn ${this.selectedType === type ? 'active' : ''}`,
          dataset: { type },
          onClick: () => this.selectType(type),
        }, type);
        this.incidentTypeButtons.set(type, button);
        return button;
      }),
    );
  }

  public setData(incidents: TorontoFireIncident[]): void {
    this.incidents = incidents;
    this.updateTypeButtons();
    this.applyFilters();
  }

  private renderIncidents(): void {
    if (this.filteredIncidents.length === 0) {
      replaceChildren(this.content,
        h('div', { className: 'empty-state' },
          this.incidents.length === 0
            ? h('p', {}, 'No active incidents')
            : h('p', {}, 'No incidents match filters')
        ),
      );
      return;
    }

    // Sort by alarm level (highest first) then by time
    const sorted = [...this.filteredIncidents].sort((a, b) => {
      if (b.alarm !== a.alarm) {
        return b.alarm - a.alarm;
      }
      return b.timestamp - a.timestamp;
    });

    replaceChildren(this.content,
      h('div', { className: 'toronto-fire-incidents' },
        ...sorted.map(inc => this.buildIncidentItem(inc))
      )
    );
  }

  private buildIncidentItem(incident: TorontoFireIncident): HTMLElement {
    const color = getAlarmColor(incident.alarm);
    const colorClass = this.getAlarmClass(incident.alarm);

    return h('div', { className: `toronto-fire-incident ${colorClass}` },
      h('div', { className: 'toronto-fire-incident-header' },
        h('div', { className: 'toronto-fire-incident-alarms' },
          h('span', {
            className: `toronto-fire-alarm-badge alarm-${incident.alarm}`,
            style: `background-color: rgb(${color.join(',')})`,
          }, `${incident.alarm}-Alarm`),
        ),
        h('div', { className: 'toronto-fire-incident-time' }, incident.time || 'N/A'),
        h('div', { className: 'toronto-fire-incident-type' }, incident.incidentType),
      ),
      h('div', { className: 'toronto-fire-incident-address' }, incident.address),
    );
  }

  private getAlarmClass(alarm: number): string {
    if (alarm >= 5) return 'alarm-critical';
    if (alarm >= 4) return 'alarm-high';
    if (alarm >= 3) return 'alarm-severe';
    if (alarm >= 2) return 'alarm-moderate';
    return 'alarm-low';
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
      const incidents = await fetchTorontoFireIncidents();
      this.lastFetch = now;
      this.setData(incidents);
    } catch (error) {
      console.error('[Toronto Fire] Refresh failed:', error);
      replaceChildren(this.content,
        h('div', { className: 'empty-state error' },
          h('p', {}, 'Failed to load incidents'),
          h('p', { className: 'error-message' }, (error as Error).message)
        )
      );
    } finally {
      this.loading = false;
    }
  }

  public destroy(): void {
    this.incidentTypeButtons.clear();
    super.destroy();
  }
}