import { describe, expect, it } from "vitest";
import { getBenchmarkScoreBarWidth } from "@/features/models/benchmark-display";

describe("getBenchmarkScoreBarWidth", () => {
  it("returns a score width for percentage units", () => {
    expect(getBenchmarkScoreBarWidth(72.5, "%")).toBe(72.5);
  });

  it("recognizes descriptive percentage units", () => {
    expect(getBenchmarkScoreBarWidth(63, "% resolved")).toBe(63);
  });

  it("clamps percentage widths at 100", () => {
    expect(getBenchmarkScoreBarWidth(108, "pass@1 %")).toBe(100);
  });

  it("clamps negative percentage widths at zero", () => {
    expect(getBenchmarkScoreBarWidth(-4, "% correct")).toBe(0);
  });

  it("does not invent a scale for raw metrics such as Elo", () => {
    expect(getBenchmarkScoreBarWidth(1240, "Elo")).toBeNull();
  });

  it("rejects non-finite scores", () => {
    expect(getBenchmarkScoreBarWidth(Number.NaN, "%")).toBeNull();
  });
});
