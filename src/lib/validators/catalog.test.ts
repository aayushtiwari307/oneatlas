import { describe, expect, it } from "vitest";
import { benchmarksQuerySchema, catalogSlugParamsSchema, emptyQuerySchema } from "./catalog";

describe("catalog query and path validation", () => {
  it("accepts empty list queries and rejects unknown parameters", () => {
    expect(emptyQuerySchema.parse({})).toEqual({});
    expect(emptyQuerySchema.safeParse({ unexpected: "value" }).success).toBe(false);
  });

  it("accepts a benchmark category and treats a blank category as omitted", () => {
    expect(benchmarksQuerySchema.parse({ category: "CODING" })).toEqual({ category: "CODING" });
    expect(benchmarksQuerySchema.parse({ category: "" })).toEqual({ category: undefined });
    expect(benchmarksQuerySchema.parse({})).toEqual({});
  });

  it("rejects unknown benchmark categories", () => {
    expect(benchmarksQuerySchema.safeParse({ category: "UNKNOWN" }).success).toBe(false);
  });

  it("accepts kebab-case detail slugs and rejects invalid path values", () => {
    expect(catalogSlugParamsSchema.parse({ slug: "example-lab" })).toEqual({ slug: "example-lab" });
    expect(catalogSlugParamsSchema.safeParse({ slug: "Example Lab" }).success).toBe(false);
    expect(catalogSlugParamsSchema.safeParse({ slug: "../providers" }).success).toBe(false);
  });
});
