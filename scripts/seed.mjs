#!/usr/bin/env node
// Loads seed/*.json into Convex through the publish HTTP API.
// Usage: CONVEX_SITE_URL=https://<deployment>.convex.site PUBLISH_TOKEN=... node scripts/seed.mjs [robots|articles|promises ...]
import fs from "node:fs";
import path from "node:path";

const site = process.env.CONVEX_SITE_URL;
const token = process.env.PUBLISH_TOKEN;
if (!site || !token) {
  console.error("Set CONVEX_SITE_URL and PUBLISH_TOKEN");
  process.exit(1);
}
const which = process.argv.slice(2);
const want = (k) => which.length === 0 || which.includes(k);
const load = (f) => {
  const p = path.join(import.meta.dirname, "..", "seed", f);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : [];
};

async function post(route, body) {
  const res = await fetch(`${site}/publish/${route}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${route} ${body.slug ?? body.id}: ${res.status} ${JSON.stringify(j)}`);
  return j;
}

let failed = 0;
for (const [kind, file, route] of [
  ["robots", "robots.json", "robot"],
  ["articles", "articles.json", "article"],
  ["promises", "promises.json", "promise"],
]) {
  if (!want(kind)) continue;
  const rows = load(file);
  let ok = 0;
  for (const row of rows) {
    try {
      await post(route, row);
      ok++;
    } catch (e) {
      failed++;
      console.error(String(e.message ?? e));
    }
  }
  console.log(`${kind}: ${ok}/${rows.length}`);
}
process.exit(failed ? 1 : 0);
