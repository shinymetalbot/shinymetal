#!/usr/bin/env node
// Uploads an existing image/video file and attaches it.
//   node --env-file=.env scripts/upload-media.mjs <file> --target article|robot|site --slug <slug> [--kind image|video] [--caption "..."]
import fs from "node:fs";
import { parseArgs } from "node:util";

const { values: a, positionals } = parseArgs({
  allowPositionals: true,
  options: { target: { type: "string" }, slug: { type: "string" }, kind: { type: "string", default: "image" }, caption: { type: "string" } },
});
const file = positionals[0];
if (!file || !a.target || !a.slug) {
  console.error("usage: upload-media.mjs <file> --target article|robot|site --slug <slug> [--kind image|video] [--caption ...]");
  process.exit(1);
}
const TYPES = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", mp4: "video/mp4", webm: "video/webm" };
const type = TYPES[file.split(".").pop().toLowerCase()] ?? "application/octet-stream";
const qs = new URLSearchParams({ target: a.target, slug: a.slug, kind: a.kind });
if (a.caption) qs.set("caption", a.caption);
const res = await fetch(`${process.env.CONVEX_SITE_URL}/publish/media?${qs}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.PUBLISH_TOKEN}`, "Content-Type": type },
  body: fs.readFileSync(file),
});
console.log(a.slug, res.status, (await res.text()).slice(0, 160));
process.exit(res.ok ? 0 : 1);
