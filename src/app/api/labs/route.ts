import { queryObject, route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { emptyQuerySchema } from "@/lib/validators/catalog";
import { listLabs } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  emptyQuerySchema.parse(queryObject(request));
  const result = await listLabs();

  return ok(result, {
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
