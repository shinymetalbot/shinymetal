import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { q, api } from "../lib/convex";
import { CLAIMS, TYPE_WORD } from "../lib/format";
import { renderMarkdown } from "../lib/markdown";

export const GET: APIRoute = async (context) => {
  const articles = await q(api.articles.listPublished, { limit: 30, withBody: true });
  const res = await rss({
    title: "ShinyMetal",
    description: "Independent news on home and humanoid robots. Every claim labeled shipped, preorder, promise, rumor or research.",
    site: context.site ?? "https://shinymetal.bot",
    items: articles.map((a) => ({
      title: a.title,
      link: `/news/${a.slug}`,
      pubDate: new Date(a.publishedAt + (a.publishedAt.length === 10 ? "T12:00:00Z" : "")),
      description: `[${CLAIMS[a.claim].word}] ${a.dek}`,
      categories: [TYPE_WORD[a.type], CLAIMS[a.claim].word, ...a.tags],
      content: "body" in a ? renderMarkdown((a as { body: string }).body) : undefined,
    })),
    customData: "<language>en-us</language>",
  });
  res.headers.set("Cache-Control", "public, max-age=300");
  return res;
};
