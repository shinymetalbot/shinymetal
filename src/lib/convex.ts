import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference, FunctionReturnType } from "convex/server";
export { api } from "../../convex/_generated/api.js";

const url = process.env.CONVEX_URL ?? import.meta.env.CONVEX_URL;
if (!url) console.warn("[convex] CONVEX_URL is not set; data pages will fail");
const client = new ConvexHttpClient(url ?? "https://missing.convex.cloud");

// Small in-process cache so a burst of page views is one Convex round trip.
const TTL_MS = Number(process.env.CONVEX_CACHE_MS ?? 60_000);
const cache = new Map<string, { at: number; value: unknown }>();

export async function q<F extends FunctionReference<"query">>(fn: F, args: F["_args"] = {}): Promise<FunctionReturnType<F>> {
  const { getFunctionName } = await import("convex/server");
  const key = getFunctionName(fn) + JSON.stringify(args);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as FunctionReturnType<F>;
  const value = await client.query(fn, args);
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}

export async function m<F extends FunctionReference<"mutation">>(fn: F, args: F["_args"]): Promise<FunctionReturnType<F>> {
  return client.mutation(fn, args);
}
