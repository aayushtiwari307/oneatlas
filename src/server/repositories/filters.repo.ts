import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const filterLabArgs = {
  select: {
    slug: true,
    name: true,
    _count: { select: { models: true } },
  },
} satisfies Prisma.LabDefaultArgs;

const filterProviderArgs = {
  select: {
    slug: true,
    name: true,
    _count: {
      select: { offerings: { where: { isActive: true } } },
    },
  },
} satisfies Prisma.ProviderDefaultArgs;

const filterModelArgs = {
  select: {
    capabilities: true,
    inputModalities: true,
    type: true,
    contextWindow: true,
    minInputPrice: true,
  },
} satisfies Prisma.ModelDefaultArgs;

export type FilterLabRecord = Prisma.LabGetPayload<typeof filterLabArgs>;
export type FilterProviderRecord = Prisma.ProviderGetPayload<typeof filterProviderArgs>;
export type FilterModelRecord = Prisma.ModelGetPayload<typeof filterModelArgs>;

export type FilterRepositoryRecords = {
  labs: FilterLabRecord[];
  providers: FilterProviderRecord[];
  models: FilterModelRecord[];
};

export async function findFilterRepositoryRecords(): Promise<FilterRepositoryRecords> {
  const [labs, providers, models] = await Promise.all([
    prisma.lab.findMany({ ...filterLabArgs, orderBy: [{ name: "asc" }, { slug: "asc" }] }),
    prisma.provider.findMany({
      ...filterProviderArgs,
      orderBy: [{ name: "asc" }, { slug: "asc" }],
    }),
    prisma.model.findMany({ ...filterModelArgs, orderBy: { slug: "asc" } }),
  ]);

  return { labs, providers, models };
}
