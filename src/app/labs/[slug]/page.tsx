import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabDetail } from "@/components/catalog/lab-detail";
import { AppError } from "@/lib/api/errors";
import { catalogSlugSchema } from "@/lib/validators/catalog";
import { getLabDetail } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

type LabPageProps = { params: Promise<{ slug: string }> };

const getLabPageData = cache(async (slug: string) => {
  try {
    return await getLabDetail(slug);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) return null;
    throw error;
  }
});

async function getValidatedSlug(params: Promise<{ slug: string }>): Promise<string | null> {
  const { slug } = await params;
  const parsed = catalogSlugSchema.safeParse(slug);
  return parsed.success ? parsed.data : null;
}

export async function generateMetadata({ params }: LabPageProps): Promise<Metadata> {
  const slug = await getValidatedSlug(params);
  if (!slug) return { title: "Lab not found", robots: { index: false, follow: false } };

  const lab = await getLabPageData(slug);
  if (!lab) return { title: "Lab not found", robots: { index: false, follow: false } };

  const description = lab.description?.slice(0, 160) || `Explore ${lab.name}'s models and release timeline on OneAtlas.`;
  return {
    title: lab.name,
    description,
    openGraph: { title: `${lab.name} · OneAtlas`, description, type: "website" },
  };
}

export default async function LabPage({ params }: LabPageProps) {
  const slug = await getValidatedSlug(params);
  if (!slug) notFound();

  const lab = await getLabPageData(slug);
  if (!lab) notFound();

  return <LabDetail lab={lab} />;
}
