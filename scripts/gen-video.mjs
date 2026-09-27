#!/usr/bin/env node
// Animates a still into a short silent loop with fal.ai Seedance 2.0 and optionally attaches it
// to an article as its hero video.
//   node scripts/gen-video.mjs --image <url> --prompt "..." --out clip.mp4 [--article <slug> --caption "..."]
// Env: FAL_API_KEY; CONVEX_SITE_URL + PUBLISH_TOKEN to upload. Needs ffmpeg for the web encode.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values: a } = parseArgs({
  options: {
    image: { type: "string" },
    prompt: { type: "string" },
    out: { type: "string" },
    duration: { type: "string", default: "6" },
    model: { type: "string", default: "bytedance/seedance-2.0/image-to-video" },
    article: { type: "string" },
    caption: { type: "string" },
  },
});
const key = process.env.FAL_API_KEY ?? process.env.FAL_KEY;
if (!a.image || !a.prompt || !a.out || !key) {
  console.error("--image, --prompt, --out and FAL_API_KEY are required");
  process.exit(1);
}
const H = { Authorization: `Key ${key}`, "Content-Type": "application/json" };
const STYLE =
  " Documentary handheld-steady camera, natural light, realistic slow and careful robot motion, no camera cuts, no text, no glowing lights, subtle and calm.";

const sub = await fetch(`https://queue.fal.run/${a.model}`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ prompt: a.prompt + STYLE, image_url: a.image, resolution: "720p", duration: a.duration, aspect_ratio: "16:9", generate_audio: false }),
}).then((r) => r.json());
if (!sub.status_url) throw new Error("submit failed: " + JSON.stringify(sub).slice(0, 300));
console.log("queued", sub.request_id);

let status;
for (let i = 0; i < 180; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  status = await fetch(sub.status_url, { headers: H }).then((r) => r.json());
  if (status.status === "COMPLETED") break;
  if (status.status === "FAILED" || status.error) throw new Error("fal failed: " + JSON.stringify(status).slice(0, 300));
}
if (status?.status !== "COMPLETED") throw new Error("fal timed out");
const result = await fetch(sub.response_url, { headers: H }).then((r) => r.json());
const url = result.video?.url;
if (!url) throw new Error("no video url: " + JSON.stringify(result).slice(0, 300));

const raw = a.out.replace(/\.mp4$/, "") + ".raw.mp4";
fs.writeFileSync(raw, Buffer.from(await (await fetch(url)).arrayBuffer()));
// web encode: silent, h264, faststart, ~1 MB
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-an", "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", a.out]);
fs.unlinkSync(raw);
console.log(`saved ${a.out} (${fs.statSync(a.out).size} bytes)`);

if (a.article) {
  const qs = new URLSearchParams({ target: "article", slug: a.article, kind: "video" });
  if (a.caption) qs.set("caption", a.caption);
  const res = await fetch(`${process.env.CONVEX_SITE_URL}/publish/media?${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PUBLISH_TOKEN}`, "Content-Type": "video/mp4" },
    body: fs.readFileSync(a.out),
  });
  console.log("upload", res.status, (await res.text()).slice(0, 200));
  if (!res.ok) process.exit(1);
}
