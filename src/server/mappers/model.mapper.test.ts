import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { mapModelSummary, type ModelSummaryRecord } from "@/server/mappers/model.mapper";

describe("model DTO mapper", () => {
  it("converts Prisma Decimal prices to numbers at the mapper boundary", () => {
    const record = {
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
      minInputPrice: new Prisma.Decimal("0.125000"),
      minOutputPrice: new Prisma.Decimal("0.750000"),
      lab: { slug: "example-lab", name: "Example Lab", logoUrl: null },
      offerings: [{ id: "offering-1" }, { id: "offering-2" }],
    } as unknown as ModelSummaryRecord;

    const dto = mapModelSummary(record);

    expect(dto.minInputPrice).toBe(0.125);
    expect(dto.minOutputPrice).toBe(0.75);
    expect(dto.releaseDate).toBe("2026-01-02T00:00:00.000Z");
    expect(dto.providerCount).toBe(2);
    expect(dto.lab.logoUrl).toBeNull();
  });
});
