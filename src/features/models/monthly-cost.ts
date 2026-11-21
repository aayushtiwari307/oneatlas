export type MonthlyCostInput = {
  inputTokens: number;
  outputTokens: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
};

/**
 * Estimate monthly USD spend from total monthly token volumes and USD/1M prices.
 * The result is rounded to the nearest cent. Cached-input discounts, taxes and
 * provider-specific minimums are intentionally excluded from this MVP estimate.
 */
export function estimateMonthlyCost({
  inputTokens,
  outputTokens,
  inputPricePer1M,
  outputPricePer1M,
}: MonthlyCostInput): number {
  const values = [inputTokens, outputTokens, inputPricePer1M, outputPricePer1M];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Token volumes and prices must be finite, non-negative numbers");
  }

  const total = (inputTokens / 1_000_000) * inputPricePer1M
    + (outputTokens / 1_000_000) * outputPricePer1M;

  if (!Number.isFinite(total)) {
    throw new RangeError("Estimated monthly cost exceeds the supported numeric range");
  }

  return Math.round((total + Number.EPSILON) * 100) / 100;
}
