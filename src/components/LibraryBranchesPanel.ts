/**
 * LibraryBranchesPanel -- displays Toronto Public Library branches stats
 * Shows total branches, by branch type, and top branches by name
 */

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import type { LibraryBranch } from '@/config/tpl-libraries';
import { getBranchTypeColor } from '@/config/tpl-libraries';

export class LibraryBranchesPanel extends Panel {
  private branches: LibraryBranch[] = [];

  constructor() {
    super({
      id: 'library-branches',
      title: 'Library Branches',
      showCount: true,
      trackActivity: false,
      infoTooltip: 'Toronto Public Library branches — community, research, and special libraries.',
    });
    this.showLoading('Loading...');
  }

  public setData(data: { branches: LibraryBranch[]; total: number; byBranchType: Record<string, number> } | null): void {
    if (data) {
      this.branches = data.branches;
      this.setCount(data.total);
      this.renderContent(data);
    }
  }

  private renderContent(data: { branches: LibraryBranch[]; total: number; byBranchType: Record<string, number> }): void {
    if (!data || !data.branches || data.branches.length === 0) {
      this.content.innerHTML = `<div style="padding:16px;color:var(--text-dim);text-align:center;">
        <p style="margin:0 0 8px 0;">No library data available</p>
        <small style="font-size:12px;color:var(--text-dim);">Data sourced from Toronto Public Library</small>
      </div>`;
      return;
    }

    const { total, byBranchType } = data;

    const summaryHtml = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px;background:var(--bg-elevated);border-radius:8px;margin-bottom:16px;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:var(--text);">${total.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text-dim);">Total Branches</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:600;color:#8b5cf6;">${Object.keys(byBranchType).length}</div>
          <div style="font-size:12px;color:var(--text-dim);">Branch Types</div>
        </div>
      </div>
    `;

    // Branch type breakdown
    const typeEntries = Object.entries(byBranchType)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const typeHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">By Branch Type</div>
        ${typeEntries.map(([branchType, count]) => {
          const color = getBranchTypeColor(branchType);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>
                <span style="font-size:13px;color:var(--text);font-weight:500;">${escapeHtml(branchType.replace(/_/g, ' '))}</span>
              </div>
              <div style="display:flex;gap:12px;font-size:12px;">
                <span style="color:var(--text-dim);">${count} branches</span>
                <span style="color:${color};font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Top branches by name (max 5)
    const topBranches = data.branches
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 5);

    const branchesHtml = `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">Branches (A-Z)</div>
        ${topBranches.map(branch => {
          const color = getBranchTypeColor(branch.branchType);
          return `
            <div style="display:flex;align-items:center;padding:6px 8px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;margin-right:8px;"></span>
              <span style="flex:1;font-size:13px;color:var(--text);">${escapeHtml(branch.name)}</span>
              <span style="font-size:11px;color:var(--text-dim);text-transform:capitalize;">${escapeHtml(branch.branchType.replace(/_/g, ' '))}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.content.innerHTML = `
      ${summaryHtml}
      ${typeHtml}
      ${branchesHtml}
      <small style="display:block;text-align:center;color:var(--text-dim);padding:12px 0 4px;font-size:11px;">
        Source: Toronto Public Library — refreshed weekly
      </small>
    `;
  }
}