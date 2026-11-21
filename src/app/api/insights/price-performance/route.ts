import { queryObject, route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { pricePerformanceQuerySchema } from "@/lib/validators/insights";
import { getPricePerformancePoints } from "@/server/services/insights.service";

export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  const query = pricePerformanceQuerySchema.parse(queryObject(request));
  const points = await getPricePerformancePoints(query);

  return ok(points, {
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
