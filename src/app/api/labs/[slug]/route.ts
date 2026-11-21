import { queryObject, route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { catalogSlugParamsSchema, emptyQuerySchema } from "@/lib/validators/catalog";
import { getLabDetail } from "@/server/services/catalog.service";

type SlugRouteContext = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export const GET = route(async (request, context: SlugRouteContext) => {
  emptyQuerySchema.parse(queryObject(request));
  const { slug } = catalogSlugParamsSchema.parse(await context.params);
  const result = await getLabDetail(slug);

  return ok(result, {
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
