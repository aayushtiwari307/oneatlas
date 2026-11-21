import { describe, expect, it } from "vitest";
import { flattenSearchResults, moveSearchSelection } from "@/features/search/search-navigation";
import type { SearchDTO } from "@/types/api";

const search: SearchDTO = {
  models: [
    {
      id: "model-1",
      slug: "atlas-chat",
      name: "Atlas Chat",
      lab: { slug: "atlas-lab", name: "Atlas Lab", logoUrl: null },
      type: "CHAT",
      releaseDate: null,
      contextWindow: null,
      maxOutput: null,
      inputModalities: ["TEXT"],
      outputModalities: ["TEXT"],
      capabilities: [],
      openWeights: false,
      minInputPrice: null,
      minOutputPrice: null,
      providerCount: 0,
    },
  ],
  labs: [{ slug: "atlas-lab", name: "Atlas Lab", logoUrl: null, modelCount: 1 }],
  providers: [{ slug: "edge-provider", name: "Edge Provider", modelCount: 2 }],
};

describe("global search navigation", () => {
  it("flattens model, lab and provider groups into linked results", () => {
    const results = flattenSearchResults(search);
    expect(results.map((result) => result.kind)).toEqual(["model", "lab", "provider"]);
    expect(results.map((result) => result.href)).toEqual([
      "/models/atlas-chat",
      "/labs/atlas-lab",
      "/providers/edge-provider",
    ]);
  });

  it("returns no items before a result payload is available", () => {
    expect(flattenSearchResults(undefined)).toEqual([]);
  });

  it("starts at the first or last result when nothing is selected", () => {
    expect(moveSearchSelection(-1, 1, 3)).toBe(0);
    expect(moveSearchSelection(-1, -1, 3)).toBe(2);
  });

  it("wraps arrow navigation at both ends", () => {
    expect(moveSearchSelection(2, 1, 3)).toBe(0);
    expect(moveSearchSelection(0, -1, 3)).toBe(2);
  });

  it("returns -1 when there are no results", () => {
    expect(moveSearchSelection(0, 1, 0)).toBe(-1);
  });
});
