import { describe, expect, it } from "vitest";
import { buildCompetitionRanks } from "./rankings.service";

describe("buildCompetitionRanks", () => {
  it("orders higher-is-better scores and uses competition ranking for ties", () => {
    const ranked = buildCompetitionRanks(
      [
        { modelSlug: "model-a", score: 99, value: "A" },
        { modelSlug: "model-b", score: 97, value: "B" },
        { modelSlug: "model-c", score: 97, value: "C" },
        { modelSlug: "model-d", score: 83, value: "D" },
      ],
      true,
      10,
    );

    expect(ranked.map(({ rank, value }) => [rank, value])).toEqual([
      [1, "A"],
      [2, "B"],
      [2, "C"],
      [4, "D"],
    ]);
  });

  it("orders lower-is-better scores ascending and preserves competition ranks", () => {
    const ranked = buildCompetitionRanks(
      [
        { modelSlug: "model-a", score: 110, value: "A" },
        { modelSlug: "model-b", score: 80, value: "B" },
        { modelSlug: "model-c", score: 80, value: "C" },
        { modelSlug: "model-d", score: 95, value: "D" },
      ],
      false,
      10,
    );

    expect(ranked.map(({ rank, score }) => [rank, score])).toEqual([
      [1, 80],
      [1, 80],
      [3, 95],
      [4, 110],
    ]);
  });

  it("uses model slug as a deterministic tie-breaker", () => {
    const ranked = buildCompetitionRanks(
      [
        { modelSlug: "z-model", score: 10, value: "Z" },
        { modelSlug: "a-model", score: 10, value: "A" },
      ],
      true,
      10,
    );

    expect(ranked.map(({ value }) => value)).toEqual(["A", "Z"]);
  });

  it("applies the requested limit after sorting", () => {
    const ranked = buildCompetitionRanks(
      [
        { modelSlug: "a", score: 1, value: "A" },
        { modelSlug: "b", score: 3, value: "B" },
        { modelSlug: "c", score: 2, value: "C" },
      ],
      true,
      2,
    );

    expect(ranked.map(({ value }) => value)).toEqual(["B", "C"]);
  });
});
