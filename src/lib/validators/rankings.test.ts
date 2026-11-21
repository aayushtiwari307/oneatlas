import { describe, expect, it } from "vitest";
import { compareQuerySchema } from "@/lib/validators/models";
import { rankingsQuerySchema } from "./rankings";

describe("compare query validation", () => {
  it("trims slug segments and accepts two to four unique kebab-case slugs", () => {
    expect(compareQuerySchema.parse({ slugs: "gpt-4o, claude-3-7-sonnet " }).slugs).toEqual([
      "gpt-4o",
      "claude-3-7-sonnet",
    ]);
  });

  it("rejects an empty or whitespace-only slug list", () => {
    expect(() => compareQuerySchema.parse({ slugs: "   " })).toThrow();
  });

  it("rejects fewer than two, more than four, and duplicate slugs", () => {
    expect(() => compareQuerySchema.parse({ slugs: "gpt-4o" })).toThrow();
    expect(() =>
      compareQuerySchema.parse({ slugs: "a,b,c,d,e" }),
    ).toThrow();
    expect(() => compareQuerySchema.parse({ slugs: "gpt-4o, gpt-4o" })).toThrow();
  });
});

describe("rankings query validation", () => {
  it("defaults to 25 entries", () => {
    expect(rankingsQuerySchema.parse({})).toEqual({ limit: 25 });
  });

  it("accepts a benchmark slug, category and explicit limit", () => {
    expect(
      rankingsQuerySchema.parse({ benchmark: "live-code-bench", category: "CODING", limit: "50" }),
    ).toEqual({ benchmark: "live-code-bench", category: "CODING", limit: 50 });
  });

  it("rejects invalid categories and limits above 100", () => {
    expect(() => rankingsQuerySchema.parse({ category: "NOT_A_CATEGORY" })).toThrow();
    expect(() => rankingsQuerySchema.parse({ limit: "9999" })).toThrow();
  });
});
