import { describe, expect, it } from "vitest";
import { groupModelsByReleaseYear } from "@/features/catalog/release-timeline";

describe("groupModelsByReleaseYear", () => {
  it("sorts years and releases newest first", () => {
    const groups = groupModelsByReleaseYear([
      { slug: "older", releaseDate: "2023-02-01T00:00:00.000Z" },
      { slug: "newest", releaseDate: "2025-06-01T00:00:00.000Z" },
      { slug: "mid", releaseDate: "2024-01-01T00:00:00.000Z" },
    ]);

    expect(groups.map((group) => group.year)).toEqual(["2025", "2024", "2023"]);
    expect(groups[0]?.models[0]?.slug).toBe("newest");
  });

  it("keeps models in the same year ordered by exact release date", () => {
    const groups = groupModelsByReleaseYear([
      { slug: "january", releaseDate: "2024-01-02T00:00:00.000Z" },
      { slug: "december", releaseDate: "2024-12-02T00:00:00.000Z" },
    ]);

    expect(groups[0]?.models.map((model) => model.slug)).toEqual(["december", "january"]);
  });

  it("places null and invalid dates in a final unknown group", () => {
    const groups = groupModelsByReleaseYear([
      { slug: "undated", releaseDate: null },
      { slug: "dated", releaseDate: "2024-01-01T00:00:00.000Z" },
      { slug: "invalid", releaseDate: "not-a-date" },
    ]);

    expect(groups.map((group) => group.year)).toEqual(["2024", "Unknown release date"]);
    expect(groups[1]?.models.map((model) => model.slug)).toEqual(["invalid", "undated"]);
  });

  it("does not mutate the caller's array", () => {
    const models = [
      { slug: "b", releaseDate: "2023-01-01T00:00:00.000Z" },
      { slug: "a", releaseDate: "2024-01-01T00:00:00.000Z" },
    ];

    groupModelsByReleaseYear(models);
    expect(models.map((model) => model.slug)).toEqual(["b", "a"]);
  });
});
