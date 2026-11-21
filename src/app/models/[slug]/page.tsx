import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModelDetail } from "@/components/models/model-detail";
import { modelSlugSchema } from "@/lib/validators/models";
import { getModelDetail, getSimilarModels } from "@/server/services/models.service";

export const dynamic = "force-dynamic";

type ModelPageProps = {
  params: Promise<{ slug: string }>;
};

type ModelPageData = {
  model: NonNullable<Awaited<ReturnType<typeof getModelDetail>>>;
  similarModels: Awaited<ReturnType<typeof getSimilarModels>>;
};

// React cache deduplicates the metadata and page reads during one request.
// The service is only called while rendering this dynamic route, never at import time.
const getModelPageData = cache(async (slug: string): Promise<ModelPageData | null> => {
  const model = await getModelDetail(slug);
  if (!model) return null;

  const similarModels = await getSimilarModels(slug);
  return { model, similarModels };
});

async function getValidatedSlug(params: Promise<{ slug: string }>): Promise<string | null> {
  const { slug } = await params;
  const parsed = modelSlugSchema.safeParse(slug);
  return parsed.success ? parsed.data : null;
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const slug = await getValidatedSlug(params);
  if (!slug) {
    return {
      title: "Model not found",
      robots: { index: false, follow: false },
    };
  }

  const data = await getModelPageData(slug);
  if (!data) {
    return {
      title: "Model not found",
      robots: { index: false, follow: false },
    };
  }

  const description = data.model.description
    ? data.model.description.slice(0, 160)
    : `Explore ${data.model.name} specifications, provider pricing, modalities and benchmark scores on OneAtlas.`;

  return {
    title: data.model.name,
    description,
    openGraph: {
      title: `${data.model.name} · OneAtlas`,
      description,
      type: "article",
    },
  };
}

export default async function ModelPage({ params }: ModelPageProps) {
  const slug = await getValidatedSlug(params);
  if (!slug) notFound();

  const data = await getModelPageData(slug);
  if (!data) notFound();

  return <ModelDetail model={data.model} similarModels={data.similarModels} />;
}
