import { query, internalMutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { robotStatus } from "./schema";

const STATUS_ORDER = { homes: 0, shipping: 1, preorder: 2, announced: 3, internal: 4, discontinued: 5 } as const;

async function withImage(ctx: QueryCtx, r: Doc<"robots">) {
  return { ...r, imageUrl: r.imageId ? await ctx.storage.getUrl(r.imageId) : null };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const robots = await ctx.db.query("robots").collect();
    robots.sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.maker.localeCompare(b.maker) || a.name.localeCompare(b.name),
    );
    return Promise.all(robots.map((r) => withImage(ctx, r)));
  },
});

export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const robot = await ctx.db.query("robots").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!robot) return null;
    const events = await ctx.db
      .query("robotStatusEvents")
      .withIndex("by_robot", (q) => q.eq("robotSlug", slug))
      .collect();
    const promises = await ctx.db
      .query("promises")
      .withIndex("by_robot", (q) => q.eq("robotSlug", slug))
      .collect();
    const published = await ctx.db
      .query("articles")
      .withIndex("by_status_date", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();
    const articles = published
      .filter((a) => a.robots.includes(slug))
      .slice(0, 6)
      .map(({ body, ...a }) => a);
    return { robot: await withImage(ctx, robot), events, promises, articles };
  },
});

export const getMany = query({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, { slugs }) => {
    const out = [];
    for (const slug of slugs.slice(0, 4)) {
      const r = await ctx.db.query("robots").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
      if (r) out.push(await withImage(ctx, r));
    }
    return out;
  },
});

/** Reality Tracker: every robot with its latest dated status event. */
export const tracker = query({
  args: {},
  handler: async (ctx) => {
    const robots = await ctx.db.query("robots").collect();
    const rows = [];
    for (const r of robots) {
      const events = await ctx.db
        .query("robotStatusEvents")
        .withIndex("by_robot", (q) => q.eq("robotSlug", r.slug))
        .order("desc")
        .take(1);
      rows.push({
        slug: r.slug,
        name: r.name,
        maker: r.maker,
        category: r.category,
        status: r.status,
        statusClaim: r.statusClaim,
        priceUsd: r.priceUsd ?? null,
        fcc: r.legal.fcc,
        teleop: r.autonomy.teleop,
        latest: events[0] ?? null,
      });
    }
    rows.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (b.latest?.date ?? "").localeCompare(a.latest?.date ?? ""));
    return rows;
  },
});

export const recentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const events = await ctx.db.query("robotStatusEvents").withIndex("by_date").order("desc").take(limit ?? 12);
    const names: Record<string, string> = {};
    for (const e of events) {
      if (names[e.robotSlug]) continue;
      const r = await ctx.db.query("robots").withIndex("by_slug", (q) => q.eq("slug", e.robotSlug)).unique();
      names[e.robotSlug] = r ? `${r.maker} ${r.name}` : e.robotSlug;
    }
    return events.map((e) => ({ ...e, robotName: names[e.robotSlug] }));
  },
});

const robotFields = {
  slug: v.string(),
  robot: v.any(),
};

/** Upsert a robot by slug and replace its status events. Used by seed + the publish HTTP API. */
export const upsert = internalMutation({
  args: robotFields,
  handler: async (ctx, { slug, robot }) => {
    const { statusEvents, imageUrl, _id, _creationTime, ...fields } = robot;
    const doc = { ...fields, slug, updatedAt: Date.now() };
    const existing = await ctx.db.query("robots").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (existing) {
      await ctx.db.replace(existing._id, { ...doc, imageId: doc.imageId ?? existing.imageId, imageCaption: doc.imageCaption ?? existing.imageCaption });
    } else {
      await ctx.db.insert("robots", doc);
    }
    if (Array.isArray(statusEvents)) {
      const old = await ctx.db.query("robotStatusEvents").withIndex("by_robot", (q) => q.eq("robotSlug", slug)).collect();
      for (const e of old) await ctx.db.delete(e._id);
      for (const e of statusEvents) {
        await ctx.db.insert("robotStatusEvents", {
          robotSlug: slug,
          date: e.date,
          status: e.status,
          note: e.note,
          sourceUrl: e.sourceUrl,
          sourceTitle: e.sourceTitle ?? null,
        });
      }
    }
    return slug;
  },
});

export const addStatusEvent = internalMutation({
  args: {
    robotSlug: v.string(),
    date: v.string(),
    status: robotStatus,
    note: v.string(),
    sourceUrl: v.string(),
    sourceTitle: v.optional(v.union(v.string(), v.null())),
    updateRobotStatus: v.optional(v.boolean()),
  },
  handler: async (ctx, { updateRobotStatus, ...e }) => {
    const robot = await ctx.db.query("robots").withIndex("by_slug", (q) => q.eq("slug", e.robotSlug)).unique();
    if (!robot) throw new Error(`unknown robot ${e.robotSlug}`);
    await ctx.db.insert("robotStatusEvents", { ...e, sourceTitle: e.sourceTitle ?? null });
    if (updateRobotStatus !== false) await ctx.db.patch(robot._id, { status: e.status, updatedAt: Date.now() });
  },
});

export const setImage = internalMutation({
  args: { slug: v.string(), imageId: v.id("_storage"), caption: v.optional(v.string()) },
  handler: async (ctx, { slug, imageId, caption }) => {
    const r = await ctx.db.query("robots").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!r) throw new Error(`unknown robot ${slug}`);
    if (r.imageId && r.imageId !== imageId) await ctx.storage.delete(r.imageId);
    await ctx.db.patch(r._id, { imageId, imageCaption: caption ?? r.imageCaption ?? null });
  },
});
