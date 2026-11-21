import { describe, expect, it } from "vitest";
import type { BenchmarkRef } from "@/types/api";
import { alignCompareBenchmarks } from "./compare.service";

const codingBenchmark: BenchmarkRef = {
  slug: "code-score",
  name: "Code Score",
  category: "CODING",
  unit: "%",
  higherIsBetter: true,
};

const latencyBenchmark: BenchmarkRef = {
  slug: "latency-ms",
  name: "Latency",
  category: "GENERAL",
  unit: "ms",
  higherIsBetter: false,
};

describe("compare benchmark alignment", () => {
  it("aligns scores in requested model order and identifies a unique higher-is-better winner", () => {
    const rows = alignCompareBenchmarks([
      { slug: "model-a", scores: [{ benchmark: codingBenchmark, score: 70 }] },
      { slug: "model-b", scores: [{ benchmark: codingBenchmark, score: 85 }] },
      { slug: "model-c", scores: [] },
    ]);

    expect(rows).toEqual([
      {
        benchmark: codingBenchmark,
        scores: { "model-a": 70, "model-b": 85, "model-c": null },
        bestModelSlug: "model-b",
      },
    ]);
  });

  it("respects lower-is-better benchmarks", () => {
    const rows = alignCompareBenchmarks([
      { slug: "model-a", scores: [{ benchmark: latencyBenchmark, score: 120 }] },
      { slug: "model-b", scores: [{ benchmark: latencyBenchmark, score: 90 }] },
    ]);
    expect(rows[0]?.bestModelSlug).toBe("model-b");
  });

  it("returns no winner when fewer than two models have a score", () => {
    const rows = alignCompareBenchmarks([
      { slug: "model-a", scores: [{ benchmark: codingBenchmark, score: 70 }] },
      { slug: "model-b", scores: [] },
    ]);

    expect(rows[0]?.scores).toEqual({ "model-a": 70, "model-b": null });
    expect(rows[0]?.bestModelSlug).toBeNull();
  });

  it("returns no winner when the best score is tied", () => {
    const rows = alignCompareBenchmarks([
      { slug: "model-a", scores: [{ benchmark: codingBenchmark, score: 85 }] },
      { slug: "model-b", scores: [{ benchmark: codingBenchmark, score: 85 }] },
      { slug: "model-c", scores: [{ benchmark: codingBenchmark, score: 70 }] },
    ]);

    expect(rows[0]?.bestModelSlug).toBeNull();
  });

  it("includes only benchmarks represented by at least one selected model", () => {
    const rows = alignCompareBenchmarks([
      { slug: "model-a", scores: [{ benchmark: codingBenchmark, score: 70 }] },
      { slug: "model-b", scores: [] },
    ]);

    expect(rows.map((row) => row.benchmark.slug)).toEqual(["code-score"]);
  });
});
