import { z } from "zod";

/** Global search returns no groups for absent or shorter-than-two-character queries. */
export const searchQuerySchema = z
  .object({
    q: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.string().max(100).optional(),
    ),
    limit: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.coerce.number().int().min(1).max(10).default(5),
    ),
  })
  .strict();

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export function isSearchableQuery(query: string | undefined): query is string {
  return query !== undefined && query.length >= 2;
}
