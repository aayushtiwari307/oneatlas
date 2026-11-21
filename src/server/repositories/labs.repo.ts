import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { modelSummaryArgs } from "@/server/mappers/model.mapper";

const labListArgs = {
  include: { _count: { select: { models: true } } },
} satisfies Prisma.LabDefaultArgs;

const labDetailArgs = {
  include: {
    _count: { select: { models: true } },
    models: {
      include: modelSummaryArgs.include,
      orderBy: [
        { releaseDate: { sort: "desc", nulls: "last" } },
        { slug: "asc" },
      ],
    },
  },
} satisfies Prisma.LabDefaultArgs;

export type LabListRecord = Prisma.LabGetPayload<typeof labListArgs>;
export type LabDetailRecord = Prisma.LabGetPayload<typeof labDetailArgs>;

export async function findLabs(): Promise<LabListRecord[]> {
  return prisma.lab.findMany({ ...labListArgs, orderBy: [{ name: "asc" }, { slug: "asc" }] });
}

export async function findLabBySlug(slug: string): Promise<LabDetailRecord | null> {
  return prisma.lab.findUnique({ where: { slug }, ...labDetailArgs });
}
