import { queryObject, route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { searchQuerySchema } from "@/lib/validators/search";
import { searchCatalog } from "@/server/services/search.service";

export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  const query = searchQuerySchema.parse(queryObject(request));
  const result = await searchCatalog(query);

  return ok(result, {
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
