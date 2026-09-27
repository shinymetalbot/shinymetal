import type { APIRoute } from "astro";
import { q, api } from "../lib/convex";
import { CLAIMS, STATUS, fmtPrice } from "../lib/format";

export const GET: APIRoute = async () => {
  const [articles, robots] = await Promise.all([q(api.articles.listPublished, { limit: 25 }), q(api.robots.list, {})]);
  const lines = [
    "# ShinyMetal",
    "",
    "> Independent publication about home and humanoid robots: news, a robot database with dated status sources, and a ledger of company promises. Every claim is labeled Shipped, Preorder, Promise, Rumor or Research. ShinyMetal does not sell robots.",
    "",
    "Claim labels: " + Object.entries(CLAIMS).map(([k, c]) => `${c.word} = ${c.help}`).join(" "),
    "Robot status: " + Object.entries(STATUS).map(([k, s]) => `${s.word} = ${s.help}`).join(" "),
    "",
    "## Sections",
    "- [News and analysis](https://shinymetal.bot/news): press releases decoded, rumors with confidence ratings, research explainers, case studies",
    "- [Robot database](https://shinymetal.bot/robots): specs, price, status, remote-operator disclosure, FCC status, security notes",
    "- [Reality tracker](https://shinymetal.bot/tracker): each robot's current status with the dated source",
    "- [Promise ledger](https://shinymetal.bot/promises): company promises marked kept, slipped, broken or open",
    "- [Compare](https://shinymetal.bot/compare): side-by-side specs for up to four robots",
    "- [About and labels](https://shinymetal.bot/about): editorial policy and label definitions",
    "- [RSS](https://shinymetal.bot/rss.xml)",
    "",
    "## Latest stories",
    ...articles.map((a) => `- [${a.title}](https://shinymetal.bot/news/${a.slug}) (${CLAIMS[a.claim].word}, ${a.publishedAt}): ${a.dek}`),
    "",
    "## Robots",
    ...robots.map(
      (r) =>
        `- [${r.maker} ${r.name}](https://shinymetal.bot/robots/${r.slug}): ${STATUS[r.status as keyof typeof STATUS]?.word ?? r.status}${r.priceUsd != null ? `, ${fmtPrice(r.priceUsd)}` : ""}`,
    ),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=600" } });
};
