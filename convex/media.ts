import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const m = await ctx.db.query("siteMedia").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (!m) return null;
    return { url: await ctx.storage.getUrl(m.storageId), contentType: m.contentType, caption: m.caption ?? null };
  },
});

export const set = internalMutation({
  args: { key: v.string(), storageId: v.id("_storage"), contentType: v.string(), caption: v.optional(v.string()) },
  handler: async (ctx, { key, storageId, contentType, caption }) => {
    const m = await ctx.db.query("siteMedia").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (m) {
      if (m.storageId !== storageId) await ctx.storage.delete(m.storageId);
      await ctx.db.patch(m._id, { storageId, contentType, caption: caption ?? null });
    } else {
      await ctx.db.insert("siteMedia", { key, storageId, contentType, caption: caption ?? null });
    }
  },
});
