import { z } from "zod";
import { catalogSlugSchema } from "@/lib/validators/catalog";

/** An omitted or blank benchmark uses the first benchmark in catalogue order. */
export const pricePerformanceQuerySchema = z
  .object({
    benchmark: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      catalogSlugSchema.optional(),
    ),
  })
  .strict();

export type PricePerformanceQuery = z.infer<typeof pricePerformanceQuerySchema>;
