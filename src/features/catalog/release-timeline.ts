export type ReleasableModel = {
  slug: string;
  releaseDate: string | null;
};

export type ReleaseGroup<T> = {
  year: string;
  models: T[];
};

function getReleaseYear(releaseDate: string | null): string | null {
  if (!releaseDate) return null;
  const date = new Date(releaseDate);
  if (Number.isNaN(date.getTime())) return null;
  return String(date.getUTCFullYear());
}

/** Groups models by UTC release year, newest first; missing/invalid dates appear last. */
export function groupModelsByReleaseYear<T extends ReleasableModel>(
  models: readonly T[],
): ReleaseGroup<T>[] {
  const sorted = [...models].sort((left, right) => {
    const leftTime = left.releaseDate ? Date.parse(left.releaseDate) : Number.NaN;
    const rightTime = right.releaseDate ? Date.parse(right.releaseDate) : Number.NaN;
    const leftValid = Number.isFinite(leftTime);
    const rightValid = Number.isFinite(rightTime);

    if (leftValid && rightValid && leftTime !== rightTime) return rightTime - leftTime;
    if (leftValid !== rightValid) return leftValid ? -1 : 1;
    return left.slug.localeCompare(right.slug);
  });

  const groups = new Map<string, T[]>();
  for (const model of sorted) {
    const year = getReleaseYear(model.releaseDate) ?? "Unknown release date";
    const existing = groups.get(year);
    if (existing) existing.push(model);
    else groups.set(year, [model]);
  }

  return [...groups.entries()].map(([year, groupedModels]) => ({
    year,
    models: groupedModels,
  }));
}
