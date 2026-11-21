export const MAX_COMPARE_MODELS = 4;
export const COMPARE_STORAGE_KEY = "oneatlas.compare.v1";

export type CompareSelection = { slug: string; name: string };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Parse a shareable comma-separated model list without inventing identifiers. */
export function parseCompareSlugs(value: string): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];

  for (const part of value.split(",")) {
    const slug = part.trim();
    if (!SLUG_PATTERN.test(slug) || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }

  return slugs;
}

/** Treat localStorage as untrusted input and discard malformed entries. */
export function normalizeCompareSelection(value: unknown): CompareSelection[] {
  if (!Array.isArray(value)) return [];

  const selections: CompareSelection[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const candidate = item as { slug?: unknown; name?: unknown };
    if (typeof candidate.slug !== "string" || typeof candidate.name !== "string") continue;

    const slug = candidate.slug.trim();
    const name = candidate.name.trim();
    if (!SLUG_PATTERN.test(slug) || name.length === 0 || seen.has(slug)) continue;

    seen.add(slug);
    selections.push({ slug, name: name.slice(0, 120) });
    if (selections.length === MAX_COMPARE_MODELS) break;
  }

  return selections;
}

export function toggleCompareSelection(
  current: readonly CompareSelection[],
  model: CompareSelection,
): CompareSelection[] {
  const normalized = normalizeCompareSelection(current);
  if (normalized.some((item) => item.slug === model.slug)) {
    return normalized.filter((item) => item.slug !== model.slug);
  }
  if (normalized.length >= MAX_COMPARE_MODELS) return normalized;

  return normalizeCompareSelection([...normalized, model]);
}

export function removeCompareSelection(
  current: readonly CompareSelection[],
  slug: string,
): CompareSelection[] {
  return normalizeCompareSelection(current).filter((item) => item.slug !== slug);
}
