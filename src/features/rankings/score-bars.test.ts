import { describe, expect, it } from "vitest";
import { getRankingBarPercent } from "./score-bars";

describe("ranking score bars", () => {
  it("scales higher-is-better scores against the highest score", () => {
    expect(getRankingBarPercent(90, [90, 45], true)).toBe(100);
    expect(getRankingBarPercent(45, [90, 45], true)).toBe(50);
  });

  it("scales lower-is-better scores against the lowest score", () => {
    expect(getRankingBarPercent(2, [2, 4], false)).toBe(100);
    expect(getRankingBarPercent(4, [2, 4], false)).toBe(50);
  });

  it("gives tied leaders full-width bars", () => {
    expect(getRankingBarPercent(7, [7, 7, 7], true)).toBe(100);
    expect(getRankingBarPercent(7, [7, 7], false)).toBe(100);
  });

  it("normalizes zero and negative values without division errors", () => {
    expect(getRankingBarPercent(0, [0, 2], false)).toBe(100);
    expect(getRankingBarPercent(2, [0, 2], false)).toBe(0);
    expect(getRankingBarPercent(-1, [-1, -3], true)).toBe(100);
    expect(getRankingBarPercent(-3, [-1, -3], true)).toBe(0);
  });

  it("returns zero for non-finite input and clamps out-of-range values", () => {
    expect(getRankingBarPercent(Number.NaN, [1, 2], true)).toBe(0);
    expect(getRankingBarPercent(3, [1, 2], true)).toBe(100);
    expect(getRankingBarPercent(-1, [1, 2], true)).toBe(0);
  });
});
