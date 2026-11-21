import { z } from "zod";
import { Capability, Modality, ModelType } from "@prisma/client";

// Built from Prisma enums so API validation can never drift from the DB.
const CAPABILITIES = Object.values(Capability) as [Capability, ...Capability[]];
const MODALITIES = Object.values(Modality) as [Modality, ...Modality[]];
const TYPES = Object.values(ModelType) as [ModelType, ...ModelType[]];

/** "a,b,c" -> ["a","b","c"]; empty/missing -> undefined */
const csv = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess(
    (v) =>
      typeof v === "string" && v.trim() !== ""
        ? v.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
    z.array(item).max(20).optional(),
  );

/** "" or missing -> undefined, otherwise coerce to number */
const optNumber = (min = 0) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(min).optional(),
  );

export const modelsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  lab: csv(z.string()),
  provider: csv(z.string()),
  capability: csv(z.enum(CAPABILITIES)),
  modality: csv(z.enum(MODALITIES)),
  type: z.enum(TYPES).optional(),
  minContext: optNumber(0),
  maxPrice: optNumber(0), // USD per 1M input tokens, matched against cheapest provider
  // No defaults here on purpose: the service resolves them (q present -> relevance, else release;
  // order depends on sort). See docs/SPEC.md section 4 and src/lib/query/models-query.ts.
  sort: z.enum(["release", "price", "context", "name", "relevance"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export type ModelsQuery = z.infer<typeof modelsQuerySchema>;

export const compareQuerySchema = z.object({
  slugs: z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.string()).min(2, "Pick at least 2 models").max(4, "Compare up to 4 models")),
});
