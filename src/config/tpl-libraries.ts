/**
 * Toronto Public Library Branches
 * Source: Toronto Public Library
 */

export interface LibraryBranch {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  branchType: string; // branch, research, special
  hours?: string;
  phone?: string;
  website?: string;
  latitude: number;
  longitude: number;
  features?: string[]; // wifi, computers, meeting_rooms, accessibility
  status: string;
}

export interface LibraryBranchData {
  branches: LibraryBranch[];
  total: number;
  byBranchType: Record<string, number>;
}

export function getBranchTypeColor(branchType: string): string {
  const normalized = branchType?.toLowerCase() || '';

  if (normalized.includes('research')) return '#8b5cf6'; // purple
  if (normalized.includes('special')) return '#f59e0b'; // orange
  if (normalized.includes('branch')) return '#3b82f6'; // blue

  return '#6b7280'; // gray
}

export function getBranchRadius(branch: LibraryBranch): number {
  // All branches same size for visibility
  return 10;
}

export function summarizeLibraryBranchData(branches: LibraryBranch[]): LibraryBranchData {
  const byBranchType: Record<string, number> = {};

  for (const branch of branches) {
    const type = branch.branchType || 'unknown';
    byBranchType[type] = (byBranchType[type] || 0) + 1;
  }

  return {
    branches,
    total: branches.length,
    byBranchType,
  };
}