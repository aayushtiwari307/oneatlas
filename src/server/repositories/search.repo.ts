import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { modelSummaryArgs, type ModelSummaryRecord } from "@/server/mappers/model.mapper";

const labSearchArgs = {
  select: {
    slug: true,
    name: true,
    logoUrl: true,
    _count: { select: { models: true } },
  },
} satisfies Prisma.LabDefaultArgs;

const providerSearchArgs = {
  select: {
    slug: true,
    name: true,
    _count: {
      select: { offerings: { where: { isActive: true } } },
    },
  },
} satisfies Prisma.ProviderDefaultArgs;

export type SearchLabRecord = Prisma.LabGetPayload<typeof labSearchArgs>;
export type SearchProviderRecord = Prisma.ProviderGetPayload<typeof providerSearchArgs>;

export async function findModelsForSearch(ids: readonly string[]): Promise<ModelSummaryRecord[]> {
  if (ids.length === 0) {
    return [];
  }

  return prisma.model.findMany({
    where: { id: { in: [...ids] } },
    ...modelSummaryArgs,
  });
}

export async function findLabsForSearch(
  query: string,
  limit: number,
): Promise<SearchLabRecord[]> {
  return prisma.lab.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    ...labSearchArgs,
    orderBy: [{ name: "asc" }, { slug: "asc" }],
    take: limit,
  });
}

export async function findProvidersForSearch(
  query: string,
  limit: number,
): Promise<SearchProviderRecord[]> {
  return prisma.provider.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    ...providerSearchArgs,
    orderBy: [{ name: "asc" }, { slug: "asc" }],
    take: limit,
  });
}
