import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("promises").collect();
    rows.sort((a, b) => a.company.localeCompare(b.company) || a.saidOn.localeCompare(b.saidOn));
    return rows;
  },
});

export const upsert = internalMutation({
  args: { key: v.string(), promise: v.any() },
  handler: async (ctx, { key, promise }) => {
    const { id, robot, _id, _creationTime, ...fields } = promise;
    const doc = { ...fields, robotSlug: fields.robotSlug ?? robot ?? null, key, updatedAt: Date.now() };
    const existing = await ctx.db.query("promises").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (existing) await ctx.db.replace(existing._id, doc);
    else await ctx.db.insert("promises", doc);
    return key;
  },
});
