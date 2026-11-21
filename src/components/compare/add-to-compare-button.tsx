"use client";

import { Check, Plus, X } from "lucide-react";
import { MAX_COMPARE_MODELS } from "@/features/compare/compare-selection";
import { useCompareSelection } from "@/features/compare/compare-selection-provider";

type AddToCompareButtonProps = {
  model: { slug: string; name: string };
  compact?: boolean;
};

export function AddToCompareButton({ model, compact = false }: AddToCompareButtonProps) {
  const { selections, ready, toggle } = useCompareSelection();
  const selected = selections.some((item) => item.slug === model.slug);
  const full = selections.length >= MAX_COMPARE_MODELS && !selected;

  return (
    <button
      type="button"
      className={`control-button ${selected ? "control-button-active" : ""} ${compact ? "!min-h-8 !px-2.5" : ""}`}
      onClick={() => toggle(model)}
      disabled={!ready || full}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${model.name} from comparison` : `Add ${model.name} to comparison`}
      title={full ? "You can compare up to four models" : undefined}
    >
      {selected ? <Check size={13} /> : full ? <X size={13} /> : <Plus size={13} />}
      <span>{selected ? "Added" : full ? "Compare full" : "Compare"}</span>
    </button>
  );
}
