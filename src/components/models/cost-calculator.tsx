"use client";

import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import type { OfferingDTO } from "@/types/api";
import { estimateMonthlyCost } from "@/features/models/monthly-cost";
import { getCheapestProviderSlugs } from "@/features/models/cheapest-provider";

type CostCalculatorProps = {
  offerings: OfferingDTO[];
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseTokenCount(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function CostCalculator({ offerings }: CostCalculatorProps) {
  const [providerSlug, setProviderSlug] = useState(offerings[0]?.provider.slug ?? "");
  const [inputTokensText, setInputTokensText] = useState("1000000");
  const [outputTokensText, setOutputTokensText] = useState("250000");

  const selectedOffering = offerings.find((offering) => offering.provider.slug === providerSlug)
    ?? offerings[0];
  const cheapestSlugs = useMemo(() => getCheapestProviderSlugs(offerings), [offerings]);
  const inputTokens = parseTokenCount(inputTokensText);
  const outputTokens = parseTokenCount(outputTokensText);
  let estimatedCost = 0;
  let calculationError = false;
  if (selectedOffering) {
    try {
      estimatedCost = estimateMonthlyCost({
        inputTokens,
        outputTokens,
        inputPricePer1M: selectedOffering.inputPricePer1M,
        outputPricePer1M: selectedOffering.outputPricePer1M,
      });
    } catch {
      calculationError = true;
    }
  }
  const isCheapest = selectedOffering
    ? cheapestSlugs.includes(selectedOffering.provider.slug)
    : false;

  if (offerings.length === 0) {
    return (
      <section className="panel mt-12 p-5 sm:p-6" aria-labelledby="cost-calculator-title">
        <div className="eyebrow">Usage planning</div>
        <h2 id="cost-calculator-title" className="mt-2 text-xl font-semibold text-white">Monthly cost calculator</h2>
        <p className="mt-3 text-sm text-slate-400">This model has no active provider pricing, so a cost estimate is not available.</p>
      </section>
    );
  }

  return (
    <section className="panel mt-12 p-5 sm:p-6" aria-labelledby="cost-calculator-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Usage planning</div>
          <h2 id="cost-calculator-title" className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">Monthly cost calculator</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Estimate token spend for this model using an active provider&apos;s listed rates.</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-200/[0.07] text-cyan-200">
          <Calculator size={18} />
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr_.9fr]">
        <div>
          <label htmlFor="cost-provider" className="field-label">Inference provider</label>
          <select
            id="cost-provider"
            className="field-control"
            value={selectedOffering?.provider.slug ?? ""}
            onChange={(event) => setProviderSlug(event.currentTarget.value)}
          >
            {offerings.map((offering) => (
              <option value={offering.provider.slug} key={offering.provider.slug}>
                {offering.provider.name}{cheapestSlugs.includes(offering.provider.slug) ? " · lowest input price" : ""}
              </option>
            ))}
          </select>
          {isCheapest ? <p className="mt-2 text-[10px] font-semibold text-emerald-300">Cheapest input-price offering for this model</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <label htmlFor="monthly-input-tokens" className="field-label">Monthly input tokens</label>
            <input
              id="monthly-input-tokens"
              className="field-control tabular-nums"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              value={inputTokensText}
              onChange={(event) => setInputTokensText(event.currentTarget.value)}
            />
          </div>
          <div>
            <label htmlFor="monthly-output-tokens" className="field-label">Monthly output tokens</label>
            <input
              id="monthly-output-tokens"
              className="field-control tabular-nums"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              value={outputTokensText}
              onChange={(event) => setOutputTokensText(event.currentTarget.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-cyan-200/15 bg-cyan-200/[0.045] p-4" aria-live="polite">
          <div className="text-[9px] font-bold uppercase tracking-[.14em] text-cyan-100/65">Estimated monthly spend</div>
          <div className="mt-3 break-words text-3xl font-semibold tracking-tight text-white tabular-nums">{calculationError ? "Value too large" : formatUsd(estimatedCost)}</div>
          <div className="mt-2 text-[10px] leading-5 text-slate-400">
            Input {formatUsd(selectedOffering.inputPricePer1M)} + output {formatUsd(selectedOffering.outputPricePer1M)} per 1M tokens.
          </div>
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 border-t border-white/[0.07] pt-4 text-[10px] leading-5 text-slate-500">
        <Info size={13} className="mt-0.5 shrink-0" />
        Estimate only. Assumes the listed USD rates remain constant and excludes cached-input discounts, taxes, retries, provider minimums and other fees. Replace the example token volumes with your expected monthly usage.
      </p>
    </section>
  );
}
