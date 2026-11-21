import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { BenchmarkListRecord } from "@/server/repositories/benchmarks.repo";
import type { LabDetailRecord, LabListRecord } from "@/server/repositories/labs.repo";
import type { ProviderDetailRecord, ProviderListRecord } from "@/server/repositories/providers.repo";
import {
  mapBenchmarkDTO,
  mapLabDetail,
  mapLabSummary,
  mapProviderDetail,
  mapProviderSummary,
} from "./catalog.mapper";

const modelRecord = {
  id: "model-id",
  slug: "example-model",
  name: "Example Model",
  type: "CHAT",
  releaseDate: new Date("2026-01-02T00:00:00.000Z"),
  contextWindow: 128_000,
  maxOutput: 8_192,
  inputModalities: ["TEXT"],
  outputModalities: ["TEXT"],
  capabilities: ["TOOLS"],
  openWeights: false,
  minInputPrice: new Prisma.Decimal("0.12"),
  minOutputPrice: new Prisma.Decimal("0.72"),
  lab: { slug: "example-lab", name: "Example Lab", logoUrl: null },
  offerings: [{ id: "offering-id" }],
};

describe("catalog DTO mappers", () => {
  it("maps benchmark score counts into modelCount", () => {
    const dto = mapBenchmarkDTO({
      slug: "code-score",
      name: "Code Score",
      category: "CODING",
      unit: "%",
      higherIsBetter: true,
      _count: { scores: 23 },
    } as BenchmarkListRecord);

    expect(dto.modelCount).toBe(23);
    expect(dto.higherIsBetter).toBe(true);
  });

  it("maps lab metadata and the count of associated models", () => {
    const dto = mapLabSummary({
      slug: "example-lab",
      name: "Example Lab",
      country: "US",
      website: "https://example.com",
      description: "Research lab",
      logoUrl: null,
      _count: { models: 4 },
    } as LabListRecord);

    expect(dto).toMatchObject({ slug: "example-lab", modelCount: 4, logoUrl: null });
  });

  it("maps lab models with their ISO release dates", () => {
    const dto = mapLabDetail({
      slug: "example-lab",
      name: "Example Lab",
      country: null,
      website: null,
      description: null,
      logoUrl: null,
      _count: { models: 1 },
      models: [modelRecord],
    } as unknown as LabDetailRecord);

    expect(dto.modelCount).toBe(1);
    expect(dto.models[0]?.releaseDate).toBe("2026-01-02T00:00:00.000Z");
    expect(dto.models[0]?.lab.slug).toBe("example-lab");
  });

  it("maps active provider offering counts", () => {
    const dto = mapProviderSummary({
      slug: "example-provider",
      name: "Example Provider",
      website: null,
      region: "global",
      description: null,
      logoUrl: null,
      _count: { offerings: 9 },
    } as ProviderListRecord);

    expect(dto.modelCount).toBe(9);
  });

  it("converts provider-specific Decimal prices at the mapper boundary", () => {
    const dto = mapProviderDetail({
      slug: "example-provider",
      name: "Example Provider",
      website: null,
      region: "global",
      description: null,
      logoUrl: null,
      _count: { offerings: 1 },
      offerings: [
        {
          inputPricePer1M: new Prisma.Decimal("0.125000"),
          outputPricePer1M: new Prisma.Decimal("0.750000"),
          cachedInputPricePer1M: new Prisma.Decimal("0.010000"),
          contextWindow: 64_000,
          maxOutput: 4_000,
          latencyMs: 120,
          throughputTps: 80,
          quantization: "fp16",
          model: modelRecord,
        },
      ],
    } as unknown as ProviderDetailRecord);

    expect(dto.models[0]?.offering).toMatchObject({
      provider: { slug: "example-provider", name: "Example Provider" },
      inputPricePer1M: 0.125,
      outputPricePer1M: 0.75,
      cachedInputPricePer1M: 0.01,
    });
    expect(dto.models[0]?.minInputPrice).toBe(0.12);
  });
});
