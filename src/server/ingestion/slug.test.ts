import { describe, expect, it } from "vitest";
import { createUniqueModelSlug, slugify } from "./slug";

describe("slug normalization", () => {
  it("lowercases names and replaces non-alphanumeric runs with one hyphen", () => {
    expect(slugify("  Meta's   Llama_3.1! ")).toBe("meta-s-llama-3-1");
  });

  it("normalizes common accented Latin characters", () => {
    expect(slugify("Mistral Éclair")).toBe("mistral-eclair");
  });

  it("returns a valid fallback for names without ASCII letters or digits", () => {
    expect(slugify("東京模型")).toBe("model");
  });

  it("appends the lab slug when a model name collides", () => {
    expect(createUniqueModelSlug("Llama 3", "meta", new Set(["llama-3"]))).toBe(
      "llama-3-meta",
    );
  });

  it("adds a numeric suffix when the lab-qualified slug also exists", () => {
    expect(
      createUniqueModelSlug("Llama 3", "meta", new Set(["llama-3", "llama-3-meta"])),
    ).toBe("llama-3-meta-2");
  });

  it("does not mutate the existing slug set", () => {
    const existing = new Set(["gpt-4"]);

    createUniqueModelSlug("GPT 4", "openai", existing);

    expect([...existing]).toEqual(["gpt-4"]);
  });
});
