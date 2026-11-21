import { route } from "@/lib/api/handler";
import { notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { modelSlugSchema } from "@/lib/validators/models";
import { getModelDetail } from "@/server/services/models.service";

export const dynamic = "force-dynamic";

type ModelRouteContext = {
  params: Promise<{ slug: string }>;
};

export const GET = route<ModelRouteContext>(async (_request, context) => {
  const params = await context.params;
  const slug = modelSlugSchema.parse(params.slug);
  const model = await getModelDetail(slug);

  if (!model) {
    throw notFound("Model");
  }

  return ok(model, {
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
