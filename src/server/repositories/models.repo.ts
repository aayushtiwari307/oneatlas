import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { escapeLike } from "@/lib/query/models-query";
import {
  modelDetailArgs,
  modelSummaryArgs,
  type ModelDetailRecord,
  type ModelSummaryRecord,
} from "@/server/mappers/model.mapper";

export type ModelSearchHit = {
  id: string;
  rank: number;
};

export async function findModelSearchHits(query: string): Promise<ModelSearchHit[]> {
  const escapedQuery = escapeLike(query);

  // Tagged-template parameters keep all user text out of SQL syntax. ESCAPE
  // chr(92) makes the backslash used by escapeLike explicit and portable.
  return prisma.$queryRaw<ModelSearchHit[]>`
    SELECT
      model."id",
      (
        COALESCE(
          ts_rank_cd(model."searchVector", websearch_to_tsquery('simple', ${query})),
          0
        ) + similarity(model."name", ${query})
      )::double precision AS "rank"
    FROM "Model" AS model
    WHERE
      model."searchVector" @@ websearch_to_tsquery('simple', ${query})
      OR model."name" % ${query}
      OR model."name" ILIKE '%' || ${escapedQuery} || '%' ESCAPE chr(92)
      OR EXISTS (
        SELECT 1
        FROM "Lab" AS lab
        WHERE lab."id" = model."labId"
          AND lab."name" ILIKE '%' || ${escapedQuery} || '%' ESCAPE chr(92)
      )
    ORDER BY "rank" DESC, model."slug" ASC
    LIMIT 500
  `;
}

export async function findModelsPage(
  where: Prisma.ModelWhereInput,
  orderBy: Prisma.ModelOrderByWithRelationInput[],
  skip: number,
  take: number,
): Promise<{ records: ModelSummaryRecord[]; total: number }> {
  const [records, total] = await prisma.$transaction([
    prisma.model.findMany({
      where,
      ...modelSummaryArgs,
      orderBy,
      skip,
      take,
    }),
    prisma.model.count({ where }),
  ]);

  return { records, total };
}

export async function findModelsForRelevance(
  where: Prisma.ModelWhereInput,
): Promise<ModelSummaryRecord[]> {
  return prisma.model.findMany({
    where,
    ...modelSummaryArgs,
    orderBy: { slug: "asc" },
  });
}

export async function findModelDetailBySlug(slug: string): Promise<ModelDetailRecord | null> {
  return prisma.model.findUnique({
    where: { slug },
    ...modelDetailArgs,
  });
}

/**
 * Similarity is intentionally explainable for the MVP: models are related when
 * they share a lab or at least one capability with the requested model.
 * Release date and slug provide stable ordering, with a hard cap of four rows.
 */
export async function findSimilarModelsBySlug(slug: string): Promise<ModelSummaryRecord[]> {
  const source = await prisma.model.findUnique({
    where: { slug },
    select: {
      labId: true,
      capabilities: true,
    },
  });

  if (!source) return [];

  const relatedConditions: Prisma.ModelWhereInput[] = [{ labId: source.labId }];
  if (source.capabilities.length > 0) {
    relatedConditions.push({ capabilities: { hasSome: source.capabilities } });
  }

  return prisma.model.findMany({
    where: {
      slug: { not: slug },
      OR: relatedConditions,
    },
    ...modelSummaryArgs,
    orderBy: [
      { releaseDate: { sort: "desc", nulls: "last" } },
      { slug: "asc" },
    ],
    take: 4,
  });
}
