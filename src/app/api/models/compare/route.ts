import { queryObject, route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { compareQuerySchema } from "@/lib/validators/models";
import { compareModels } from "@/server/services/compare.service";

export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  const query = compareQuerySchema.parse(queryObject(request));
  const result = await compareModels(query.slugs);

  return ok(result, {
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
