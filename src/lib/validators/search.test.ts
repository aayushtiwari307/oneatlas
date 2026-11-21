import { describe, expect, it } from "vitest";
import { isSearchableQuery, searchQuerySchema } from "@/lib/validators/search";

describe("search query validation", () => {
  it("trims the query and defaults the per-group limit", () => {
    expect(searchQuerySchema.parse({ q: "  gpt  " })).toEqual({ q: "gpt", limit: 5 });
  });

  it("allows an absent query so the service can return empty groups", () => {
    expect(searchQuerySchema.parse({})).toEqual({ limit: 5 });
  });

  it("treats an empty limit as omitted", () => {
    expect(searchQuerySchema.parse({ q: "", limit: "" })).toEqual({ q: "", limit: 5 });
  });

  it("accepts a one-character query for the documented empty-groups behavior", () => {
    const parsed = searchQuerySchema.parse({ q: "g" });
    expect(isSearchableQuery(parsed.q)).toBe(false);
  });

  it("rejects limits outside 1 through 10", () => {
    expect(() => searchQuerySchema.parse({ q: "ai", limit: 0 })).toThrow();
    expect(() => searchQuerySchema.parse({ q: "ai", limit: 11 })).toThrow();
  });

  it("rejects non-integer limits and unknown query parameters", () => {
    expect(() => searchQuerySchema.parse({ q: "ai", limit: 2.5 })).toThrow();
    expect(() => searchQuerySchema.parse({ q: "ai", debug: "true" })).toThrow();
  });

  it("rejects queries longer than 100 characters", () => {
    expect(() => searchQuerySchema.parse({ q: "a".repeat(101) })).toThrow();
  });
});
