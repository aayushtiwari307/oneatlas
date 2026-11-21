import { queryObject, route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { modelsQuerySchema } from "@/lib/validators/models";
import { listModels } from "@/server/services/models.service";

export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  const query = modelsQuerySchema.parse(queryObject(request));
  const result = await listModels(query);

  return ok(result.data, {
    meta: result.meta,
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
