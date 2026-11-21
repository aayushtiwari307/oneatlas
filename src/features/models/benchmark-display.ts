/**
 * Returns a meaningful progress-bar width only for percentage-based benchmarks.
 * Non-percentage scores (for example Elo) have no shared 0–100 scale and are
 * displayed as raw values instead of being misleadingly normalized.
 */
export function getBenchmarkScoreBarWidth(score: number, unit: string): number | null {
  if (!Number.isFinite(score) || !unit.includes("%")) return null;
  return Math.max(0, Math.min(100, score));
}
