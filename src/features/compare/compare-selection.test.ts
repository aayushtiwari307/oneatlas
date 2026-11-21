import { describe, expect, it } from "vitest";
import {
  MAX_COMPARE_MODELS,
  normalizeCompareSelection,
  parseCompareSlugs,
  removeCompareSelection,
  toggleCompareSelection,
} from "./compare-selection";

const models = [
  { slug: "gpt-4o", name: "GPT-4o" },
  { slug: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet" },
  { slug: "gemini-2-5-pro", name: "Gemini 2.5 Pro" },
  { slug: "deepseek-r1", name: "DeepSeek R1" },
  { slug: "llama-3-3", name: "Llama 3.3" },
];

describe("compare selection", () => {
  it("parses unique valid slugs from shareable URL state", () => {
    expect(parseCompareSlugs("gpt-4o, claude-3-7-sonnet,gpt-4o, bad_slug")).toEqual([
      "gpt-4o",
      "claude-3-7-sonnet",
    ]);
  });

  it("normalizes untrusted persisted values and caps the list at four", () => {
    expect(normalizeCompareSelection([...models, { slug: "bad_slug", name: "Bad" }])).toEqual(
      models.slice(0, MAX_COMPARE_MODELS),
    );
  });

  it("adds a model once", () => {
    expect(toggleCompareSelection([models[0]], models[0])).toEqual([]);
    expect(toggleCompareSelection([models[0]], models[1])).toEqual(models.slice(0, 2));
  });

  it("does not add a fifth model", () => {
    expect(toggleCompareSelection(models.slice(0, 4), models[4])).toEqual(models.slice(0, 4));
  });

  it("removes a selected model without changing the remaining order", () => {
    expect(removeCompareSelection(models.slice(0, 3), models[1].slug)).toEqual([
      models[0],
      models[2],
    ]);
  });

  it("returns an empty selection for malformed storage data", () => {
    expect(normalizeCompareSelection({ slug: "gpt-4o", name: "GPT-4o" })).toEqual([]);
    expect(normalizeCompareSelection([null, 2, "gpt-4o", { slug: "gpt-4o", name: " " }])).toEqual([]);
  });
});
