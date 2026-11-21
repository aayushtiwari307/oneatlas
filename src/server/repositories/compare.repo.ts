import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const compareModelArgs = {
  include: {
    lab: {
      select: {
        slug: true,
        name: true,
        logoUrl: true,
      },
    },
    offerings: {
      where: { isActive: true },
      select: { id: true },
    },
    scores: {
      include: {
        benchmark: {
          select: {
            slug: true,
            name: true,
            category: true,
            unit: true,
            higherIsBetter: true,
          },
        },
      },
    },
  },
} satisfies Prisma.ModelDefaultArgs;

export type CompareModelRecord = Prisma.ModelGetPayload<typeof compareModelArgs>;

export async function findModelsForCompareBySlugs(
  slugs: readonly string[],
): Promise<CompareModelRecord[]> {
  return prisma.model.findMany({
    where: { slug: { in: [...slugs] } },
    ...compareModelArgs,
  });
}
