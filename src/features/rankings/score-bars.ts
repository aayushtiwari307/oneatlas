/**
 * Return a 0–100 bar width relative to the benchmark leader.
 * For positive ratio-scale values, higher-is-better uses score / best and
 * lower-is-better uses best / score. If those ratios are undefined (for
 * example, negative Elo deltas or a zero-valued best result), fall back to
 * min–max normalization while keeping the correct winner at 100%.
 */
export function getRankingBarPercent(
  score: number,
  scores: readonly number[],
  higherIsBetter: boolean,
): number {
  const finiteScores = scores.filter(Number.isFinite);
  if (!Number.isFinite(score) || finiteScores.length === 0) return 0;

  const best = higherIsBetter
    ? Math.max(...finiteScores)
    : Math.min(...finiteScores);
  const worst = higherIsBetter
    ? Math.min(...finiteScores)
    : Math.max(...finiteScores);

  if (best === worst) return 100;

  let ratio: number;
  if (higherIsBetter && best > 0) {
    ratio = score / best;
  } else if (!higherIsBetter && best > 0 && score > 0) {
    ratio = best / score;
  } else if (higherIsBetter) {
    ratio = (score - worst) / (best - worst);
  } else {
    ratio = (worst - score) / (worst - best);
  }

  const percentage = Math.min(100, Math.max(0, ratio * 100));
  return Math.round(percentage * 10) / 10;
}
