import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import { fetchSchools } from '@/services/schools';
import {
  getSchoolColor,
  getSchoolBoardLabel,
  getSchoolBoardKey,
  type SchoolsData,
  type School,
} from '@/config/schools';

export class SchoolsPanel extends Panel {
  private data: SchoolsData | null = null;
  private loading = false;
  private activeBoards: Set<string> = new Set();
  private showList = false;

  constructor() {
    super({
      id: 'schools',
      title: 'Toronto Schools',
      defaultRowSpan: 2,
      infoTooltip: 'School locations across Toronto — public, Catholic, French, and private boards.',
    });

    // Set up event delegation for click handling
    this.element.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-board]') as HTMLElement | null;
      if (target) {
        this.toggleBoard(target.dataset.board!);
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
      const result = await fetchSchools();

      if (!result) {
        this.showError('School data unavailable');
        return;
      }

      this.data = result;
      this.render();
    } catch (error) {
      console.error('[SchoolsPanel] Fetch failed:', error);
      this.showError('Failed to load school data');
    } finally {
      this.loading = false;
    }
  }

  public setData(data: SchoolsData | null): void {
    if (data) {
      this.data = data;
      this.render();
    }
  }

  private toggleBoard(key: string): void {
    if (this.activeBoards.has(key)) {
      this.activeBoards.delete(key);
    } else {
      this.activeBoards.add(key);
    }
    this.render();
  }

  private getFilteredSchools(): School[] {
    if (!this.data) return [];

    const schools = this.data.schools;

    if (this.activeBoards.size === 0) {
      return schools;
    }

    return schools.filter((school) => {
      const boardKey = getSchoolBoardKey(school.boardName);
      return this.activeBoards.has(boardKey);
    });
  }

  private render(): void {
    if (!this.data) {
      this.showError('No data available');
      return;
    }

    const totalSchools = this.data.schools.length;
    const filteredSchools = this.getFilteredSchools();
    const topSchools = filteredSchools.slice(0, 20);

    // Build board stats
    const boardStats = [
      { key: 'TDSB', label: 'TDSB', color: '#3b82f6' },
      { key: 'TCDSB', label: 'TCDSB', color: '#10b981' },
      { key: 'Private', label: 'Private', color: '#a855f7' },
      { key: 'French', label: 'French', color: '#f59e0b' },
      { key: 'Other', label: 'Other', color: '#6b7280' },
    ];

    const boardStatsHtml = boardStats
      .map((stat) => {
        const count = this.data!.schools.filter((s) => getSchoolBoardKey(s.boardName) === stat.key).length;
        return `
          <div class="schools-board-stat">
            <div class="schools-board-dot" style="background-color: ${stat.color}"></div>
            <div class="schools-board-label">${escapeHtml(stat.label)}</div>
            <div class="schools-board-count">${count}</div>
          </div>
        `;
      })
      .join('');

    // Build filter buttons
    const filterButtonsHtml = boardStats
      .map((stat) => {
        const isActive = this.activeBoards.has(stat.key);
        const activeClass = isActive ? 'active' : '';
        const activeStyle = isActive ? `background-color: ${stat.color}; color: white;` : '';
        return `
          <button
            class="schools-filter-btn ${activeClass}"
            data-board="${stat.key}"
            style="${activeStyle}"
          >
            ${escapeHtml(stat.label)}
          </button>
        `;
      })
      .join('');

    // Build top 20 schools list
    const schoolsListHtml = topSchools
      .map((school) => {
        const boardKey = getSchoolBoardKey(school.boardName);
        const boardLabel = getSchoolBoardLabel(school.boardName);
        const boardColor = getSchoolColor(school.boardName);
        return `
          <div class="schools-list-item">
            <div class="schools-list-name">${escapeHtml(school.name)}</div>
            <div class="schools-list-details">
              <span
                class="schools-list-board"
                style="color: ${boardColor}"
              >
                ${escapeHtml(boardLabel)}
              </span>
              <span class="schools-list-type">${escapeHtml(school.schoolType)}</span>
            </div>
          </div>
        `;
      })
      .join('');

    const listToggleHtml = `
      <div class="schools-list-toggle" data-toggle-list>
        <button class="schools-toggle-btn">
          ${this.showList ? 'Hide' : 'Show'} Top 20
          <span class="schools-toggle-icon">
            ${this.showList ? '▼' : '▶'}
          </span>
        </button>
      </div>
    `;

    const listHtml = this.showList
      ? `
        <div class="schools-list">
          <div class="schools-list-header">
            ${filteredSchools.length} schools ${this.activeBoards.size > 0 ? '(filtered)' : ''}
          </div>
          ${schoolsListHtml}
        </div>
      `
      : '';

    this.setContent(`
      <div class="schools-container">
        <div class="schools-summary">
          <div class="schools-total">
            <div class="schools-total-label">Schools</div>
            <div class="schools-total-value">${totalSchools}</div>
          </div>
          <div class="schools-board-stats">
            ${boardStatsHtml}
          </div>
        </div>
        <div class="schools-filters">
          ${filterButtonsHtml}
        </div>
        ${listToggleHtml}
        ${listHtml}
      </div>
    `);
  }
}