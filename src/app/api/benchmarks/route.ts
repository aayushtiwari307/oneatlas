import { queryObject, route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { benchmarksQuerySchema } from "@/lib/validators/catalog";
import { listBenchmarks } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  const query = benchmarksQuerySchema.parse(queryObject(request));
  const result = await listBenchmarks(query.category);

  return ok(result, {
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
