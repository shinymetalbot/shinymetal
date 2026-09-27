import { query, internalMutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

async function withMedia(ctx: QueryCtx, a: Doc<"articles">) {
  return {
    ...a,
    heroUrl: a.heroImageId ? await ctx.storage.getUrl(a.heroImageId) : null,
    heroVideoUrl: a.heroVideoId ? await ctx.storage.getUrl(a.heroVideoId) : null,
  };
}

export const listPublished = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
    tag: v.optional(v.string()),
    withBody: v.optional(v.boolean()),
  },
  handler: async (ctx, { limit, type, tag, withBody }) => {
    const today = new Date().toISOString().slice(0, 10);
    let rows = await ctx.db
      .query("articles")
      .withIndex("by_status_date", (q) => q.eq("status", "published").lte("publishedAt", today + "￿"))
      .order("desc")
      .collect();
    if (type) rows = rows.filter((a) => a.type === type);
    if (tag) rows = rows.filter((a) => a.tags.includes(tag));
    rows = rows.slice(0, limit ?? 50);
    const out = await Promise.all(rows.map((a) => withMedia(ctx, a)));
    return withBody ? out : out.map(({ body, ...a }) => a);
  },
});

export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const a = await ctx.db.query("articles").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!a || a.status !== "published") return null;
    const robots = [];
    for (const s of a.robots) {
      const r = await ctx.db.query("robots").withIndex("by_slug", (q) => q.eq("slug", s)).unique();
      if (r) robots.push({ ...r, imageUrl: r.imageId ? await ctx.storage.getUrl(r.imageId) : null });
    }
    const more = (
      await ctx.db
        .query("articles")
        .withIndex("by_status_date", (q) => q.eq("status", "published"))
        .order("desc")
        .take(8)
    )
      .filter((x) => x.slug !== slug)
      .slice(0, 3)
      .map(({ body, ...x }) => x);
    return { article: await withMedia(ctx, a), robots, more };
  },
});

/** Slugs of published articles missing a hero image (for the image pipeline). */
export const missingHero = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("articles").collect();
    return rows.filter((a) => !a.heroImageId).map((a) => a.slug);
  },
});

export const upsert = internalMutation({
  args: { slug: v.string(), article: v.any() },
  handler: async (ctx, { slug, article }) => {
    const { heroPrompt, heroUrl, heroVideoUrl, _id, _creationTime, ...fields } = article;
    const doc = {
      status: "published",
      author: "ShinyMetal Desk",
      tags: [],
      robots: [],
      confidence: null,
      sourceQuote: null,
      sourceAttribution: null,
      ...fields,
      slug,
      updatedAt: Date.now(),
    };
    const existing = await ctx.db.query("articles").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (existing) {
      await ctx.db.replace(existing._id, {
        ...doc,
        heroImageId: doc.heroImageId ?? existing.heroImageId,
        heroVideoId: doc.heroVideoId ?? existing.heroVideoId,
        heroCaption: doc.heroCaption ?? existing.heroCaption,
      });
    } else {
      await ctx.db.insert("articles", doc);
    }
    return slug;
  },
});

export const setHero = internalMutation({
  args: {
    slug: v.string(),
    storageId: v.id("_storage"),
    kind: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, { slug, storageId, kind, caption }) => {
    const a = await ctx.db.query("articles").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!a) throw new Error(`unknown article ${slug}`);
    const field = kind === "image" ? "heroImageId" : "heroVideoId";
    const old = a[field];
    if (old && old !== storageId) await ctx.storage.delete(old);
    await ctx.db.patch(a._id, { [field]: storageId, heroCaption: caption ?? a.heroCaption ?? null });
  },
});

export const setStatus = internalMutation({
  args: { slug: v.string(), status: v.union(v.literal("draft"), v.literal("published")) },
  handler: async (ctx, { slug, status }) => {
    const a = await ctx.db.query("articles").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!a) throw new Error(`unknown article ${slug}`);
    await ctx.db.patch(a._id, { status });
  },
});
