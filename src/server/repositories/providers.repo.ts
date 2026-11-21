import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { modelSummaryArgs } from "@/server/mappers/model.mapper";

const activeOfferingsCount = {
  offerings: { where: { isActive: true } },
} as const;

const providerListArgs = {
  include: { _count: { select: activeOfferingsCount } },
} satisfies Prisma.ProviderDefaultArgs;

const providerDetailArgs = {
  include: {
    _count: { select: activeOfferingsCount },
    offerings: {
      where: { isActive: true },
      orderBy: [{ inputPricePer1M: "asc" }, { model: { slug: "asc" } }],
      include: { model: { include: modelSummaryArgs.include } },
    },
  },
} satisfies Prisma.ProviderDefaultArgs;

export type ProviderListRecord = Prisma.ProviderGetPayload<typeof providerListArgs>;
export type ProviderDetailRecord = Prisma.ProviderGetPayload<typeof providerDetailArgs>;

export async function findProviders(): Promise<ProviderListRecord[]> {
  return prisma.provider.findMany({ ...providerListArgs, orderBy: [{ name: "asc" }, { slug: "asc" }] });
}

export async function findProviderBySlug(slug: string): Promise<ProviderDetailRecord | null> {
  return prisma.provider.findUnique({ where: { slug }, ...providerDetailArgs });
}
