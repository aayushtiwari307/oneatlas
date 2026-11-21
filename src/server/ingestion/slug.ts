/** Convert a human-readable name into the project's stable lowercase slug format. */
export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // A non-Latin-only name can normalize to an empty ASCII slug. Keep the
  // result valid and let the lab suffix disambiguate it where possible.
  return slug || "model";
}

/**
 * Create a unique model slug. Prefer the plain model name; on collision append
 * the lab slug as required by the ingestion contract. A numeric suffix is the
 * final deterministic fallback for duplicate names within the same lab.
 */
export function createUniqueModelSlug(
  modelName: string,
  labSlug: string,
  existingSlugs: ReadonlySet<string>,
): string {
  const baseSlug = slugify(modelName);
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  const labQualifiedSlug = `${baseSlug}-${slugify(labSlug)}`;
  if (!existingSlugs.has(labQualifiedSlug)) {
    return labQualifiedSlug;
  }

  let suffix = 2;
  let candidate = `${labQualifiedSlug}-${suffix}`;
  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${labQualifiedSlug}-${suffix}`;
  }

  return candidate;
}
