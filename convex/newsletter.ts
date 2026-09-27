import { mutation, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const subscribe = mutation({
  args: { email: v.string(), source: v.optional(v.string()) },
  handler: async (ctx, { email, source }) => {
    const clean = email.trim().toLowerCase();
    if (clean.length > 254 || !EMAIL.test(clean)) return { ok: false as const, error: "invalid_email" };
    const existing = await ctx.db.query("subscribers").withIndex("by_email", (q) => q.eq("email", clean)).unique();
    if (existing) {
      if (existing.unsubscribed) await ctx.db.patch(existing._id, { unsubscribed: false });
      return { ok: true as const, already: true };
    }
    const id = await ctx.db.insert("subscribers", {
      email: clean,
      source: source?.slice(0, 80) ?? null,
      createdAt: Date.now(),
      resendContactId: null,
      unsubscribed: false,
    });
    await ctx.scheduler.runAfter(0, internal.newsletter.syncToResend, { id });
    return { ok: true as const, already: false };
  },
});

export const getSubscriber = internalQuery({
  args: { id: v.id("subscribers") },
  handler: (ctx, { id }) => ctx.db.get(id),
});

export const markSynced = internalMutation({
  args: { id: v.id("subscribers"), contactId: v.string() },
  handler: (ctx, { id, contactId }) => ctx.db.patch(id, { resendContactId: contactId }),
});

export const unsynced = internalQuery({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("subscribers").collect()).filter((s) => !s.resendContactId && !s.unsubscribed).map((s) => s._id),
});

/**
 * Adds the subscriber to the Resend audience. Needs RESEND_API_KEY (full access, not send-only)
 * and RESEND_AUDIENCE_ID set on the Convex deployment; without them it is a no-op and
 * `syncAll` backfills later.
 */
export const syncToResend = internalAction({
  args: { id: v.id("subscribers") },
  handler: async (ctx, { id }): Promise<{ skipped: boolean; ok?: boolean }> => {
    const key = process.env.RESEND_API_KEY;
    const audience = process.env.RESEND_AUDIENCE_ID;
    if (!key || !audience) return { skipped: true };
    const sub = await ctx.runQuery(internal.newsletter.getSubscriber, { id });
    if (!sub || sub.resendContactId) return { skipped: true };
    const res = await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: sub.email, unsubscribed: false }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.id) {
      console.warn(`[newsletter] resend ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
      return { skipped: false, ok: false };
    }
    await ctx.runMutation(internal.newsletter.markSynced, { id, contactId: body.id });
    return { skipped: false, ok: true };
  },
});

export const syncAll = internalAction({
  args: {},
  handler: async (ctx): Promise<number> => {
    const ids: Id<"subscribers">[] = await ctx.runQuery(internal.newsletter.unsynced, {});
    for (const id of ids) await ctx.runAction(internal.newsletter.syncToResend, { id });
    return ids.length;
  },
});

/** Deletes a subscriber row (deletion requests, test cleanup). Remove the Resend contact separately. */
export const removeByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const s = await ctx.db.query("subscribers").withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase())).unique();
    if (s) await ctx.db.delete(s._id);
    return !!s;
  },
});
