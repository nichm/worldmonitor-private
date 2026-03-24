/**
 * NeighbourhoodsPanel -- displays Toronto neighbourhood boundaries
 * Shows neighbourhood count and list
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { Neighbourhood } from '@/config/neighbourhoods';

export class NeighbourhoodsPanel extends Panel {
  private neighbourhoods: Neighbourhood[] = [];

  constructor() {
    super({
      id: 'neighbourhoods',
      title: 'Neighbourhood Boundaries',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto neighbourhood boundaries from City Planning (158 neighbourhoods).',
    });
    this.showLoading('Loading...');
  }

  public setData(data: Neighbourhood[] | null): void {
    if (data) {
      this.neighbourhoods = data;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.neighbourhoods || this.neighbourhoods.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No neighbourhood data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto CKAN</small>
      </div>`;
      return;
    }

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(1,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${this.neighbourhoods.length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Neighbourhoods</div>
        </div>
      </div>
    `;

    // Neighbourhood list (show first 15)
    const sortedNeighbourhoods = [...this.neighbourhoods].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    const neighbourhoodListHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Neighbourhoods (A-Z)</div>
        ${sortedNeighbourhoods.slice(0, 15).map((neighbourhood) => `
          <div style="padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
            <div style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(neighbourhood.name)}</div>
          </div>
        `).join('')}
        ${sortedNeighbourhoods.length > 15 ? `<div style="text-align:center;padding:8px;color:var(--text-dim);font-size:12px;">+ ${sortedNeighbourhoods.length - 15} more</div>` : ''}
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${neighbourhoodListHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto CKAN — refreshed daily
      </small>
    `;
  }
}