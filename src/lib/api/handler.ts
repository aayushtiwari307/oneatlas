import type { NextRequest } from "next/server";
import { toErrorResponse } from "./response";

/**
 * Wraps a route handler so thrown errors (Zod, AppError, unknown) always
 * become the standard error envelope. Keeps individual routes free of try/catch.
 */
export function route<C = unknown>(
  fn: (req: NextRequest, ctx: C) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/** Turns ?a=1&b=2 into a plain object for Zod to parse. */
export function queryObject(req: Request) {
  return Object.fromEntries(new URL(req.url).searchParams.entries());
}
