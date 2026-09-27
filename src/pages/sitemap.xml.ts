import type { APIRoute } from "astro";
import { q, api } from "../lib/convex";

const STATIC = ["/", "/news", "/robots", "/compare", "/tracker", "/promises", "/about", "/newsletter"];

export const GET: APIRoute = async () => {
  const [articles, robots] = await Promise.all([q(api.articles.listPublished, { limit: 1000 }), q(api.robots.list, {})]);
  const url = (loc: string, lastmod?: string) =>
    `<url><loc>https://shinymetal.bot${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  const body = [
    ...STATIC.map((p) => url(p)),
    ...articles.map((a) => url(`/news/${a.slug}`, new Date(a.updatedAt).toISOString().slice(0, 10))),
    ...robots.map((r) => url(`/robots/${r.slug}`, new Date(r.updatedAt).toISOString().slice(0, 10))),
  ].join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=600" },
  });
};
