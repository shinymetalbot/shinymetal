import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Publish API for the Carrier5 content pipeline.
 * Auth: `Authorization: Bearer $PUBLISH_TOKEN` (env var on the Convex deployment).
 *
 *   POST /publish/article        JSON article (see seed/README.md)       -> upsert by slug
 *   POST /publish/robot          JSON robot incl. statusEvents           -> upsert by slug
 *   POST /publish/promise        JSON promise (id = stable key)          -> upsert by key
 *   POST /publish/status-event   {robotSlug,date,status,note,sourceUrl}  -> append + update robot status
 *   POST /publish/media?target=article|robot|site&slug=..&kind=image|video&caption=..
 *        raw bytes body (Content-Type image/* or video/*)                -> stores + attaches
 *   POST /publish/article-status {slug,status:"draft"|"published"}
 */
const http = httpRouter();

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function authed(req: Request) {
  const token = process.env.PUBLISH_TOKEN;
  return !!token && req.headers.get("Authorization") === `Bearer ${token}`;
}

const SLUG = /^[a-z0-9][a-z0-9-]{1,120}$/;
const CLAIMS = ["shipped", "preorder", "promise", "rumor", "research"];

function validateArticle(a: any): string | null {
  if (!a || typeof a !== "object") return "body must be a JSON object";
  if (!SLUG.test(a.slug ?? "")) return "slug must be kebab-case";
  if (!["decoded", "rumor", "research", "case"].includes(a.type)) return "type must be decoded|rumor|research|case";
  if (!CLAIMS.includes(a.claim)) return "claim must be shipped|preorder|promise|rumor|research";
  for (const k of ["title", "dek", "body", "publishedAt"]) if (typeof a[k] !== "string" || !a[k]) return `${k} is required`;
  if (!Array.isArray(a.sources) || a.sources.length < 2) return "at least 2 sources are required";
  if (a.sources.some((s: any) => !/^https?:\/\//.test(s?.url ?? ""))) return "every source needs an http(s) url";
  if (a.type === "rumor" && typeof a.confidence !== "number") return "rumors need a numeric confidence 0-100";
  return null;
}

http.route({
  path: "/publish/article",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!authed(req)) return json(401, { error: "unauthorized" });
    const a = await req.json().catch(() => null);
    const err = validateArticle(a);
    if (err) return json(400, { error: err });
    const article = {
      ...a,
      readMinutes: a.readMinutes ?? Math.max(2, Math.round(a.body.split(/\s+/).length / 230)),
    };
    await ctx.runMutation(internal.articles.upsert, { slug: a.slug, article });
    return json(200, { ok: true, slug: a.slug, url: `https://shinymetal.bot/news/${a.slug}` });
  }),
});

http.route({
  path: "/publish/article-status",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!authed(req)) return json(401, { error: "unauthorized" });
    const b = await req.json().catch(() => null);
    if (!b?.slug || !["draft", "published"].includes(b.status)) return json(400, { error: "slug + status required" });
    await ctx.runMutation(internal.articles.setStatus, { slug: b.slug, status: b.status });
    return json(200, { ok: true });
  }),
});

http.route({
  path: "/publish/robot",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!authed(req)) return json(401, { error: "unauthorized" });
    const r = await req.json().catch(() => null);
    if (!r || !SLUG.test(r.slug ?? "") || !r.name || !r.maker || !r.status || !r.summary)
      return json(400, { error: "slug, name, maker, status, summary required" });
    await ctx.runMutation(internal.robots.upsert, { slug: r.slug, robot: r });
    return json(200, { ok: true, slug: r.slug });
  }),
});

http.route({
  path: "/publish/promise",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!authed(req)) return json(401, { error: "unauthorized" });
    const p = await req.json().catch(() => null);
    const key = p?.id ?? p?.key;
    if (!key || !p.company || !p.claim || !p.saidOn || !p.sourceUrl || !p.outcome)
      return json(400, { error: "id, company, claim, saidOn, sourceUrl, outcome required" });
    await ctx.runMutation(internal.promises.upsert, { key, promise: p });
    return json(200, { ok: true, key });
  }),
});

http.route({
  path: "/publish/status-event",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!authed(req)) return json(401, { error: "unauthorized" });
    const e = await req.json().catch(() => null);
    if (!e?.robotSlug || !e.date || !e.status || !e.note || !e.sourceUrl)
      return json(400, { error: "robotSlug, date, status, note, sourceUrl required" });
    try {
      await ctx.runMutation(internal.robots.addStatusEvent, e);
    } catch (err: any) {
      return json(400, { error: String(err?.message ?? err) });
    }
    return json(200, { ok: true });
  }),
});

http.route({
  path: "/publish/media",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!authed(req)) return json(401, { error: "unauthorized" });
    const u = new URL(req.url);
    const target = u.searchParams.get("target");
    const slug = u.searchParams.get("slug") ?? "";
    const kind = u.searchParams.get("kind") === "video" ? "video" : "image";
    const caption = u.searchParams.get("caption") ?? undefined;
    const type = req.headers.get("Content-Type") ?? "application/octet-stream";
    if (!/^(image|video)\//.test(type)) return json(400, { error: "Content-Type must be image/* or video/*" });
    const blob = await req.blob();
    if (blob.size === 0) return json(400, { error: "empty body" });
    const storageId = (await ctx.storage.store(new Blob([blob], { type }))) as Id<"_storage">;
    try {
      if (target === "article") await ctx.runMutation(internal.articles.setHero, { slug, storageId, kind, caption });
      else if (target === "robot") await ctx.runMutation(internal.robots.setImage, { slug, imageId: storageId, caption });
      else if (target === "site") await ctx.runMutation(internal.media.set, { key: slug, storageId, contentType: type, caption });
      else throw new Error("target must be article|robot|site");
    } catch (err: any) {
      await ctx.storage.delete(storageId);
      return json(400, { error: String(err?.message ?? err) });
    }
    return json(200, { ok: true, storageId, url: await ctx.storage.getUrl(storageId) });
  }),
});

export default http;
