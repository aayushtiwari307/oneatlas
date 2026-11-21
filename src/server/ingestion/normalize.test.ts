import { Capability, Modality, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  normalizeCapabilities,
  normalizeModalities,
  normalizePricePerToken,
} from "./normalize";

describe("OpenRouter field normalizers", () => {
  it("converts per-token price to per-1M using exact decimal arithmetic", () => {
    expect(normalizePricePerToken("0.0000001").toString()).toBe("0.1");
    expect(normalizePricePerToken("0.000001").toString()).toBe("1");
    expect(normalizePricePerToken("0.000000125").toString()).toBe("0.125");
  });

  it("accepts zero pricing", () => {
    expect(normalizePricePerToken("0").equals(new Prisma.Decimal(0))).toBe(true);
  });

  it.each(["-1", "-0.000001", "NaN", "Infinity", "not-a-price", ""])(
    "rejects invalid or negative token price %s",
    (price) => {
      expect(() => normalizePricePerToken(price)).toThrow(
        "expected a finite non-negative decimal string",
      );
    },
  );

  it("maps supported modalities, drops unknown values and removes duplicates", () => {
    expect(normalizeModalities(["text", "IMAGE", "audio", "image", "pdf", " video "])).toEqual([
      Modality.TEXT,
      Modality.IMAGE,
      Modality.AUDIO,
      Modality.VIDEO,
    ]);
  });

  it("maps the documented capability parameters and adds vision for image input", () => {
    expect(
      normalizeCapabilities(
        ["tools", "reasoning", "include_reasoning", "response_format", "structured_outputs", "web_search", "code_execution"],
        [Modality.TEXT, Modality.IMAGE],
      ),
    ).toEqual([
      Capability.TOOLS,
      Capability.REASONING,
      Capability.JSON_MODE,
      Capability.STRUCTURED_OUTPUT,
      Capability.WEB_SEARCH,
      Capability.CODE_EXECUTION,
      Capability.VISION,
    ]);
  });

  it("maps search and code execution parameters and speech aliases", () => {
    expect(normalizeModalities(["speech", "transcription"])).toEqual([Modality.AUDIO]);
    expect(
      normalizeCapabilities(["web_search", "code_execution"], [Modality.TEXT]),
    ).toEqual([Capability.WEB_SEARCH, Capability.CODE_EXECUTION]);
  });

  it("does not infer vision when image is not an input modality", () => {
    expect(normalizeCapabilities(["tools"], [Modality.TEXT])).toEqual([Capability.TOOLS]);
  });
});
