import { describe, expect, it } from "vitest";
import { buildModelsRequest, type ModelExplorerQueryState } from "./models-query";

const defaults: ModelExplorerQueryState = {
  q: "",
  lab: "",
  provider: "",
  capability: "",
  modality: "",
  type: "",
  minContext: "",
  maxPrice: "",
  sort: "release",
  order: "desc",
  page: 1,
  limit: 24,
};

describe("buildModelsRequest", () => {
  it("omits empty filters and includes stable paging defaults", () => {
    const params = new URLSearchParams(buildModelsRequest(defaults));
    expect(params.get("q")).toBeNull();
    expect(params.get("lab")).toBeNull();
    expect(params.get("sort")).toBe("release");
    expect(params.get("order")).toBe("desc");
    expect(params.get("page")).toBe("1");
    expect(params.get("limit")).toBe("24");
  });

  it("preserves combined CSV filters and numeric ranges", () => {
    const params = new URLSearchParams(
      buildModelsRequest({
        ...defaults,
        q: "  gpt ",
        capability: "TOOLS,REASONING",
        modality: "TEXT,IMAGE",
        minContext: "128000",
        maxPrice: "0.5",
        sort: "price",
        order: "asc",
        page: 3,
      }),
    );

    expect(params.get("q")).toBe("gpt");
    expect(params.get("capability")).toBe("TOOLS,REASONING");
    expect(params.get("modality")).toBe("TEXT,IMAGE");
    expect(params.get("minContext")).toBe("128000");
    expect(params.get("maxPrice")).toBe("0.5");
    expect(params.get("sort")).toBe("price");
    expect(params.get("page")).toBe("3");
  });

  it("omits invalid numeric values and clamps page and limit", () => {
    const params = new URLSearchParams(
      buildModelsRequest({ ...defaults, minContext: "many", maxPrice: "-1", page: 0, limit: 999 }),
    );

    expect(params.has("minContext")).toBe(false);
    expect(params.has("maxPrice")).toBe(false);
    expect(params.get("page")).toBe("1");
    expect(params.get("limit")).toBe("100");
  });
});
