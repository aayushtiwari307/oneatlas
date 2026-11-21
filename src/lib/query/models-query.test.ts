import { describe, expect, it } from "vitest";
import { compareQuerySchema, modelsQuerySchema } from "@/lib/validators/models";
import {
  buildModelsOrderBy,
  buildModelsWhere,
  createPageMeta,
  escapeLike,
  resolveSort,
} from "@/lib/query/models-query";

describe("model query helpers", () => {
  it("defaults to release date descending without a search query", () => {
    expect(resolveSort(modelsQuerySchema.parse({}))).toEqual({
      sort: "release",
      order: "desc",
    });
  });

  it("defaults to relevance descending when a search query is present", () => {
    expect(resolveSort(modelsQuerySchema.parse({ q: "claude" }))).toEqual({
      sort: "relevance",
      order: "desc",
    });
  });

  it("treats relevance without a query as release sorting", () => {
    expect(resolveSort(modelsQuerySchema.parse({ sort: "relevance" }))).toEqual({
      sort: "release",
      order: "desc",
    });
  });

  it("uses the documented defaults and respects an explicit order", () => {
    expect(resolveSort(modelsQuerySchema.parse({ sort: "name" }))).toEqual({
      sort: "name",
      order: "asc",
    });
    expect(resolveSort(modelsQuerySchema.parse({ sort: "context", order: "asc" }))).toEqual({
      sort: "context",
      order: "asc",
    });
  });

  it("escapes LIKE wildcard and escape characters", () => {
    expect(escapeLike("gpt%_\\4o")).toBe("gpt\\%\\_\\\\4o");
  });

  it("combines filters with AND semantics and supports search candidate IDs", () => {
    const query = modelsQuerySchema.parse({
      lab: "openai,anthropic",
      provider: "together",
      capability: "TOOLS,VISION",
      modality: "TEXT,IMAGE",
      type: "CHAT",
      minContext: "32000",
      maxPrice: "2.5",
    });

    expect(buildModelsWhere(query, ["model-a", "model-b"])).toEqual({
      id: { in: ["model-a", "model-b"] },
      lab: { is: { slug: { in: ["openai", "anthropic"] } } },
      offerings: {
        some: {
          isActive: true,
          provider: { is: { slug: { in: ["together"] } } },
        },
      },
      capabilities: { hasEvery: ["TOOLS", "VISION"] },
      inputModalities: { hasEvery: ["TEXT", "IMAGE"] },
      type: "CHAT",
      contextWindow: { gte: 32000 },
      minInputPrice: { lte: 2.5 },
    });
  });

  it("rejects limits above the API maximum", () => {
    expect(() => modelsQuerySchema.parse({ limit: "9999" })).toThrow();
  });

  it("rejects duplicate compare slugs before the compare API is called", () => {
    expect(() => compareQuerySchema.parse({ slugs: "gpt-4o,gpt-4o" })).toThrow();
  });

  it("returns no candidates when an explicitly empty search result is supplied", () => {
    expect(buildModelsWhere(modelsQuerySchema.parse({}), [])).toEqual({
      id: { in: [] },
    });
  });

  it("uses nulls-last ordering and a unique slug tiebreaker", () => {
    expect(buildModelsOrderBy("price", "asc")).toEqual([
      { minInputPrice: { sort: "asc", nulls: "last" } },
      { slug: "asc" },
    ]);
    expect(buildModelsOrderBy("name", "desc")).toEqual([
      { name: "desc" },
      { slug: "asc" },
    ]);
  });

  it("keeps total pages at one for empty data and rounds up otherwise", () => {
    expect(createPageMeta(1, 24, 0)).toEqual({
      page: 1,
      limit: 24,
      total: 0,
      totalPages: 1,
    });
    expect(createPageMeta(2, 24, 25).totalPages).toBe(2);
  });
});
