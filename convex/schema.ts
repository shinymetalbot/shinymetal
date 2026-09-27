import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const claim = v.union(
  v.literal("shipped"),
  v.literal("preorder"),
  v.literal("promise"),
  v.literal("rumor"),
  v.literal("research"),
);
export const robotStatus = v.union(
  v.literal("internal"),
  v.literal("announced"),
  v.literal("preorder"),
  v.literal("shipping"),
  v.literal("homes"),
  v.literal("discontinued"),
);
export const source = v.object({
  title: v.string(),
  url: v.string(),
  date: v.optional(v.union(v.string(), v.null())),
});

const num = v.optional(v.union(v.number(), v.null()));
const str = v.optional(v.union(v.string(), v.null()));

export default defineSchema({
  robots: defineTable({
    slug: v.string(),
    name: v.string(),
    maker: v.string(),
    category: v.union(
      v.literal("humanoid"),
      v.literal("quadruped"),
      v.literal("home"),
      v.literal("arm"),
      v.literal("kit"),
    ),
    country: str,
    status: robotStatus,
    statusClaim: claim,
    priceUsd: num,
    priceNote: str,
    priceClaim: v.optional(v.union(claim, v.null())),
    heightM: num,
    weightKg: num,
    dof: num,
    payloadKg: num,
    runtimeH: num,
    speedMps: num,
    handsDof: num,
    compute: str,
    releaseNote: str,
    summary: v.string(),
    autonomy: v.object({
      teleop: v.union(v.literal("yes"), v.literal("no"), v.literal("partial"), v.literal("unknown")),
      note: str,
    }),
    legal: v.object({
      fcc: v.union(
        v.literal("approved"),
        v.literal("pending"),
        v.literal("not-filed"),
        v.literal("barred"),
        v.literal("n/a"),
        v.literal("unknown"),
      ),
      fccNote: str,
      eu: str,
      security: str,
    }),
    website: str,
    sources: v.array(source),
    imageId: v.optional(v.id("_storage")),
    imageCaption: str,
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  robotStatusEvents: defineTable({
    robotSlug: v.string(),
    date: v.string(),
    status: robotStatus,
    note: v.string(),
    sourceUrl: v.string(),
    sourceTitle: str,
  })
    .index("by_robot", ["robotSlug", "date"])
    .index("by_date", ["date"]),

  promises: defineTable({
    key: v.string(),
    company: v.string(),
    robotSlug: str,
    saidOn: v.string(),
    by: str,
    claim: v.string(),
    quote: str,
    dueBy: str,
    outcome: v.union(v.literal("kept"), v.literal("slipped"), v.literal("broken"), v.literal("pending")),
    outcomeNote: str,
    sourceUrl: v.string(),
    sourceTitle: str,
    outcomeSourceUrl: str,
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_company", ["company", "saidOn"])
    .index("by_robot", ["robotSlug", "saidOn"]),

  articles: defineTable({
    slug: v.string(),
    type: v.union(v.literal("decoded"), v.literal("rumor"), v.literal("research"), v.literal("case")),
    title: v.string(),
    dek: v.string(),
    claim: claim,
    confidence: num,
    publishedAt: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    author: v.string(),
    readMinutes: v.number(),
    robots: v.array(v.string()),
    tags: v.array(v.string()),
    sourceQuote: str,
    sourceAttribution: str,
    body: v.string(),
    sources: v.array(source),
    heroImageId: v.optional(v.id("_storage")),
    heroCaption: str,
    heroVideoId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_date", ["status", "publishedAt"]),

  subscribers: defineTable({
    email: v.string(),
    source: str,
    createdAt: v.number(),
    resendContactId: str,
    unsubscribed: v.boolean(),
  }).index("by_email", ["email"]),

  // key/value slots for site-level media (home hero video etc.)
  siteMedia: defineTable({
    key: v.string(),
    storageId: v.id("_storage"),
    contentType: v.string(),
    caption: str,
  }).index("by_key", ["key"]),
});
