import { describe, expect, it } from "vitest";
import { buildFiltersDTO } from "@/server/mappers/filters.mapper";

describe("buildFiltersDTO", () => {
  it("counts each capability and modality at most once per model", () => {
    const result = buildFiltersDTO({
      labs: [{ slug: "lab-a", name: "Lab A", count: 2 }],
      providers: [{ slug: "provider-a", name: "Provider A", count: 1 }],
      models: [
        {
          capabilities: ["TOOLS", "TOOLS", "VISION"],
          inputModalities: ["TEXT", "IMAGE", "IMAGE"],
          type: "CHAT",
          contextWindow: 1000,
          minInputPrice: 0.5,
        },
        {
          capabilities: ["TOOLS"],
          inputModalities: ["TEXT"],
          type: "EMBEDDING",
          contextWindow: 4000,
          minInputPrice: 1.25,
        },
      ],
    });

    expect(result.capabilities).toEqual([
      { value: "TOOLS", count: 2 },
      { value: "VISION", count: 1 },
    ]);
    expect(result.modalities).toEqual([
      { value: "IMAGE", count: 1 },
      { value: "TEXT", count: 2 },
    ]);
  });

  it("counts model types and passes through global lab/provider counts", () => {
    const result = buildFiltersDTO({
      labs: [{ slug: "lab-a", name: "Lab A", count: 4 }],
      providers: [{ slug: "provider-a", name: "Provider A", count: 3 }],
      models: [
        {
          capabilities: [],
          inputModalities: [],
          type: "CHAT",
          contextWindow: null,
          minInputPrice: null,
        },
        {
          capabilities: [],
          inputModalities: [],
          type: "CHAT",
          contextWindow: null,
          minInputPrice: null,
        },
      ],
    });

    expect(result.labs).toEqual([{ slug: "lab-a", name: "Lab A", count: 4 }]);
    expect(result.providers).toEqual([
      { slug: "provider-a", name: "Provider A", count: 3 },
    ]);
    expect(result.types).toEqual([{ value: "CHAT", count: 2 }]);
  });

  it("computes ranges from non-null values and returns nulls for an empty range", () => {
    const result = buildFiltersDTO({
      labs: [],
      providers: [],
      models: [
        {
          capabilities: [],
          inputModalities: [],
          type: "CHAT",
          contextWindow: 8192,
          minInputPrice: 0.1,
        },
        {
          capabilities: [],
          inputModalities: [],
          type: "CHAT",
          contextWindow: null,
          minInputPrice: null,
        },
        {
          capabilities: [],
          inputModalities: [],
          type: "CHAT",
          contextWindow: 32768,
          minInputPrice: 2.75,
        },
      ],
    });

    expect(result.contextRange).toEqual({ min: 8192, max: 32768 });
    expect(result.priceRange).toEqual({ min: 0.1, max: 2.75 });
  });

  it("returns null ranges when every value is null", () => {
    const result = buildFiltersDTO({
      labs: [],
      providers: [],
      models: [
        {
          capabilities: [],
          inputModalities: [],
          type: "CHAT",
          contextWindow: null,
          minInputPrice: null,
        },
      ],
    });

    expect(result.contextRange).toEqual({ min: null, max: null });
    expect(result.priceRange).toEqual({ min: null, max: null });
  });
});
