export type NumericCompareValue = { slug: string; value: number | null };

/** Return every tied winner; null values are never treated as zero. */
export function getBestCompareSlugs(
  values: readonly NumericCompareValue[],
  direction: "lower" | "higher",
): string[] {
  const available = values.filter(
    (item): item is { slug: string; value: number } =>
      item.value !== null && Number.isFinite(item.value),
  );
  if (available.length === 0) return [];

  const bestValue = available.reduce(
    (best, item) => direction === "lower"
      ? Math.min(best, item.value)
      : Math.max(best, item.value),
    available[0].value,
  );

  return available.filter((item) => item.value === bestValue).map((item) => item.slug);
}
