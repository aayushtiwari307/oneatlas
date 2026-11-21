import { describe, expect, it } from "vitest";
import {
  emptySearchResult,
  orderRecordsBySearchHits,
} from "@/server/services/search.helpers";

describe("global search helpers", () => {
  it("returns the required empty grouped response", () => {
    expect(emptySearchResult()).toEqual({ models: [], labs: [], providers: [] });
  });

  it("restores the relevance order from SQL hits", () => {
    const hits = [
      { id: "model-b", rank: 3 },
      { id: "model-a", rank: 2 },
      { id: "model-c", rank: 1 },
    ];
    const records = [
      { id: "model-a", slug: "a" },
      { id: "model-c", slug: "c" },
      { id: "model-b", slug: "b" },
    ];

    expect(orderRecordsBySearchHits(hits, records).map((record) => record.id)).toEqual([
      "model-b",
      "model-a",
      "model-c",
    ]);
  });

  it("ignores missing records without disturbing the remaining hit order", () => {
    const hits = [
      { id: "missing", rank: 2 },
      { id: "present", rank: 1 },
    ];

    expect(orderRecordsBySearchHits(hits, [{ id: "present" }])).toEqual([
      { id: "present" },
    ]);
  });
});
