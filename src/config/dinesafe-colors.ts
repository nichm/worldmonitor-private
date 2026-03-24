/**
 * DineSafe Color Helpers
 * Provides color coding for Toronto DineSafe inspection statuses
 */

export type DineSafeStatus = 'Pass' | 'Conditional Pass' | 'Closed' | 'Unknown';

/**
 * Get color based on DineSafe inspection status
 * - Pass: Green (safe)
 * - Conditional Pass: Yellow (needs attention)
 * - Closed: Red (unsafe/suspended)
 */
export function getDineSafeColor(status: string | null | undefined): [number, number, number, number] {
  if (!status) return [220, 38, 38, 200] as [number, number, number, number];

  const normalizedStatus = status.toLowerCase().trim();

  if (normalizedStatus === 'pass') {
    return [34, 197, 94, 200] as [number, number, number, number]; // Green
  } else if (normalizedStatus === 'conditional pass' || normalizedStatus.includes('conditional')) {
    return [234, 179, 8, 200] as [number, number, number, number]; // Yellow
  } else if (normalizedStatus === 'closed' || normalizedStatus.includes('close')) {
    return [220, 38, 38, 200] as [number, number, number, number]; // Red
  }

  return [220, 38, 38, 200] as [number, number, number, number]; // Default red
}