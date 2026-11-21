import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProviderDetail } from "@/components/catalog/provider-detail";
import { AppError } from "@/lib/api/errors";
import { catalogSlugSchema } from "@/lib/validators/catalog";
import { getProviderDetail } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

type ProviderPageProps = { params: Promise<{ slug: string }> };

const getProviderPageData = cache(async (slug: string) => {
  try {
    return await getProviderDetail(slug);
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

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const slug = await getValidatedSlug(params);
  if (!slug) return { title: "Provider not found", robots: { index: false, follow: false } };

  const provider = await getProviderPageData(slug);
  if (!provider) return { title: "Provider not found", robots: { index: false, follow: false } };

  const description = provider.description?.slice(0, 160) || `Explore active models and provider-specific pricing from ${provider.name} on OneAtlas.`;
  return {
    title: provider.name,
    description,
    openGraph: { title: `${provider.name} · OneAtlas`, description, type: "website" },
  };
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const slug = await getValidatedSlug(params);
  if (!slug) notFound();

  const provider = await getProviderPageData(slug);
  if (!provider) notFound();

  return <ProviderDetail provider={provider} />;
}
