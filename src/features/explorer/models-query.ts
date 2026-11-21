export type ModelExplorerQueryState = {
  q: string;
  lab: string;
  provider: string;
  capability: string;
  modality: string;
  type: string;
  minContext: string;
  maxPrice: string;
  sort: string;
  order: string;
  page: number;
  limit: number;
};

/** Build the API request from URL-backed explorer state, excluding UI-only state. */
export function buildModelsRequest(state: ModelExplorerQueryState): string {
  const params = new URLSearchParams();
  const textFields: Array<keyof Pick<
    ModelExplorerQueryState,
    "q" | "lab" | "provider" | "capability" | "modality" | "type"
  >> = ["q", "lab", "provider", "capability", "modality", "type"];

  for (const field of textFields) {
    const value = state[field].trim();
    if (value) params.set(field, value);
  }

  const minContext = Number(state.minContext);
  if (state.minContext.trim() && Number.isFinite(minContext) && minContext >= 0) {
    params.set("minContext", String(minContext));
  }

  const maxPrice = Number(state.maxPrice);
  if (state.maxPrice.trim() && Number.isFinite(maxPrice) && maxPrice >= 0) {
    params.set("maxPrice", String(maxPrice));
  }

  params.set("sort", state.sort || "release");
  params.set("order", state.order || "desc");
  params.set("page", String(Math.max(1, Math.floor(state.page))));
  params.set("limit", String(Math.min(100, Math.max(1, Math.floor(state.limit)))));

  return params.toString();
}
