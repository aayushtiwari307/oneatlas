import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export type CachePolicy = { sMaxAge: number; staleWhileRevalidate: number };

/** Success envelope: { data, meta? } */
export function ok<T>(
  data: T,
  opts: { meta?: Record<string, unknown>; cache?: CachePolicy; status?: number } = {},
) {
  const res = NextResponse.json(
    opts.meta ? { data, meta: opts.meta } : { data },
    { status: opts.status ?? 200 },
  );
  if (opts.cache) {
    res.headers.set(
      "Cache-Control",
      `public, s-maxage=${opts.cache.sMaxAge}, stale-while-revalidate=${opts.cache.staleWhileRevalidate}`,
    );
  }
  return res;
}

/** Failure envelope: { error: { code, message, details? } } */
export function toErrorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      { status: 400 },
    );
  }
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status },
    );
  }
  // Unknown errors: log server-side, return a generic message (no internals leaked).
  console.error("[api] unhandled error", err);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 },
  );
}
