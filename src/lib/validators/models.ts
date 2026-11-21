import { z } from "zod";
import { Capability, Modality, ModelType } from "@prisma/client";

// Built from Prisma enums so API validation can never drift from the DB.
const CAPABILITIES = Object.values(Capability) as [Capability, ...Capability[]];
const MODALITIES = Object.values(Modality) as [Modality, ...Modality[]];
const TYPES = Object.values(ModelType) as [ModelType, ...ModelType[]];

/** "a,b,c" -> ["a","b","c"]; empty/missing -> undefined */
const csv = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== ""
        ? value.split(",").map((part) => part.trim()).filter(Boolean)
        : undefined,
    z.array(item).max(20).optional(),
  );

/** "" or missing -> undefined, otherwise coerce to number */
const optionalNumber = (minimum = 0) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(minimum).optional(),
  );

export const modelsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  lab: csv(z.string()),
  provider: csv(z.string()),
  capability: csv(z.enum(CAPABILITIES)),
  modality: csv(z.enum(MODALITIES)),
  type: z.enum(TYPES).optional(),
  minContext: optionalNumber(0),
  maxPrice: optionalNumber(0), // USD per 1M input tokens, matched against cheapest provider.
  // Defaults are resolved in the service so query semantics stay in one place.
  sort: z.enum(["release", "price", "context", "name", "relevance"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export type ModelsQuery = z.infer<typeof modelsQuerySchema>;

export const modelSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a lowercase kebab-case model slug");

export const compareQuerySchema = z.object({
  slugs: z
    .string()
    .trim()
    .min(1, "Provide model slugs")
    .transform((value) => value.split(",").map((part) => part.trim()))
    .pipe(z.array(modelSlugSchema).min(2, "Pick at least 2 models").max(4, "Compare up to 4 models"))
    .refine((slugs) => new Set(slugs).size === slugs.length, "Model slugs must be unique"),
});
