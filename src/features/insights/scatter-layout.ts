import type { PricePerformancePointDTO } from "@/types/api";

export type ScatterPoint = PricePerformancePointDTO & { x: number; y: number };

/**
 * Map price/score data to an SVG plot area. Lower blended prices sit left;
 * the benchmark's preferred score direction sits at the top of the chart.
 */
export function layoutScatterPoints(
  points: readonly PricePerformancePointDTO[],
  higherIsBetter: boolean,
  width: number,
  height: number,
  padding = 48,
): ScatterPoint[] {
  const validPoints = points.filter((point) =>
    Number.isFinite(point.blendedPrice)
    && point.blendedPrice >= 0
    && Number.isFinite(point.score),
  );
  if (validPoints.length === 0) return [];

  const prices = validPoints.map((point) => point.blendedPrice);
  const scores = validPoints.map((point) => point.score);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const plotWidth = Math.max(0, width - padding * 2);
  const plotHeight = Math.max(0, height - padding * 2);

  return validPoints.map((point) => {
    const priceRatio = maxPrice === minPrice ? 0.5 : (point.blendedPrice - minPrice) / (maxPrice - minPrice);
    const scoreRatio = maxScore === minScore ? 0.5 : (point.score - minScore) / (maxScore - minScore);
    const topRatio = higherIsBetter ? 1 - scoreRatio : scoreRatio;

    return {
      ...point,
      x: padding + priceRatio * plotWidth,
      y: padding + topRatio * plotHeight,
    };
  });
}
