import { NextResponse } from "next/server";
import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const response = ok({ status: "ok", db: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    // Health checks must report availability without exposing connection details.
    return NextResponse.json(
      { data: { status: "unavailable", db: false } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
});
