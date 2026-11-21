import { queryObject, route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { rankingsQuerySchema } from "@/lib/validators/rankings";
import { getRankings } from "@/server/services/rankings.service";

export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  const query = rankingsQuerySchema.parse(queryObject(request));
  const result = await getRankings(query);

  return ok(result, {
    cache: { sMaxAge: 60, staleWhileRevalidate: 300 },
  });
});
