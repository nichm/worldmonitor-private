/**
 * ProtestEventsPanel -- displays Toronto Protest & Demonstration Events
 * Shows total event locations, distribution by type, and crowd size categories
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { ProtestEvent, ProtestEventsData } from '@/services/protest-events';
import { getProtestEventTypeColor, getProtestEventTypeLabel, getCrowdSizeLabel } from '@/services/protest-events';

export class ProtestEventsPanel extends Panel {
  private events: ProtestEvent[] = [];
  private lastUpdated?: string;

  constructor() {
    super({
      id: 'protest-events',
      title: 'Protest Events',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto protest & demonstration event locations with typical crowd sizes.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: ProtestEvent[] | null, lastUpdated?: string): void {
    if (data) {
      this.events = data;
      this.lastUpdated = lastUpdated;
      this.setCount(data.length);
      this.renderContent();
    }
  }

  private renderContent(): void {
    if (!this.events || this.events.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No protest event data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto protest/event locations</small>
      </div>`;
      return;
    }

    // Calculate type distribution
    const typeCounts: Record<string, number> = {};
    const crowdSizeCounts: Record<string, number> = {
      'Small (< 500)': 0,
      'Medium (500-2,000)': 0,
      'Large (2,000-5,000)': 0,
      'Very Large (5,000+)': 0,
    };

    for (const event of this.events) {
      const typeLabel = getProtestEventTypeLabel(event.type);
      typeCounts[typeLabel] = (typeCounts[typeLabel] || 0) + 1;

      const crowdLabel = getCrowdSizeLabel(event.typicalCrowdSize);
      crowdSizeCounts[crowdLabel] = (crowdSizeCounts[crowdLabel] || 0) + 1;
    }

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${this.events.length.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Locations</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#f59e0b;">${this.calculateAvgCrowdSize().toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Avg Crowd Size</div>
        </div>
      </div>
    `;

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Event Type</div>
        ${Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:10px;height:10px;border-radius:2px;background:${getProtestEventTypeColor(type)};display:inline-block;"></span>
                <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(type)}</span>
              </div>
              <div style="font-size:12px;color:var(--text);font-weight:600;">${count.toLocaleString()}</div>
            </div>
          `).join('')}
      </div>
    `;

    const crowdSizeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Crowd Size</div>
        ${Object.entries(crowdSizeCounts)
          .map(([size, count]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(size)}</span>
              <div style="font-size:12px;color:var(--text);font-weight:600;">${count.toLocaleString()}</div>
            </div>
          `).join('')}
      </div>
    `;

    // Format last updated timestamp
    const formattedLastUpdated = this.lastUpdated
      ? new Date(this.lastUpdated).toLocaleString('en-CA', {
          timeZone: 'America/Toronto',
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : 'Unknown';

    this.content.innerHTML = `
      ${summaryHtml}
      ${typeHtml}
      ${crowdSizeHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto protest/event locations • Updated: ${escapeHtml(formattedLastUpdated)}
      </small>
    `;
  }

  private calculateAvgCrowdSize(): number {
    if (this.events.length === 0) return 0;
    const total = this.events.reduce((sum, event) => sum + event.typicalCrowdSize, 0);
    return Math.round(total / this.events.length);
  }
}