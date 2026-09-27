#!/usr/bin/env node
// Generates an image with GPT-image (the ChatGPT subscription's image_generation tool, via the
// Codex OAuth backend) and optionally uploads it to Convex through /publish/media.
//
//   node scripts/gen-image.mjs --prompt "..." --out hero.webp [--style hero|drawing]
//        [--target article|robot|site --slug <slug> --caption "..."]
//
// Env: CODEX_AUTH (default /shared-workspaces/secrets/codex/auth.json or the carrier5 host path),
//      CODEX_MODEL (default gpt-5.6-terra), CONVEX_SITE_URL + PUBLISH_TOKEN for uploads.
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values: a } = parseArgs({
  options: {
    prompt: { type: "string" },
    out: { type: "string" },
    style: { type: "string", default: "hero" },
    size: { type: "string", default: "1536x1024" },
    target: { type: "string" },
    slug: { type: "string" },
    caption: { type: "string" },
  },
});
if (!a.prompt || !a.out) {
  console.error("--prompt and --out are required");
  process.exit(1);
}

const STYLES = {
  hero:
    "Editorial documentary photograph for a careful technology publication. Natural light, eye level, a real place with ordinary clutter, muted realistic colors, shallow depth of field. " +
    "Any robot is a generic, unbranded humanoid with a matte light-grey shell and a plain dark face panel; no glowing eyes, no LEDs, no logos, no text, no sci-fi styling, no lens flare, no dramatic lighting. Scene: ",
  drawing:
    "Technical patent-style line drawing: thin dark ink hairlines on warm bone paper (#f4f2ec), orthographic three-quarter view, precise engineering linework with light construction lines and a few leader lines without text, " +
    "exactly one small cobalt blue (#2f4fb3) highlight, no shading fills, no text, no labels, no logos, generous empty margin. Subject: ",
};

const authPath = [process.env.CODEX_AUTH, "/shared-workspaces/secrets/codex/auth.json", "/home/granthooks/carrier5/shared-workspaces/secrets/codex/auth.json"].find(
  (p) => p && fs.existsSync(p),
);
if (!authPath) throw new Error("codex auth.json not found (set CODEX_AUTH)");
const auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
const sid = crypto.randomUUID();

async function generate(prompt) {
  const res = await fetch("https://chatgpt.com/backend-api/codex/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.tokens.access_token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      originator: "codex_cli_rs",
      "OpenAI-Beta": "responses=experimental",
      "User-Agent": "codex_cli_rs/0.118.0 (ShinyMetal)",
      session_id: sid,
      "x-codex-installation-id": sid,
      ...(auth.tokens.account_id ? { "chatgpt-account-id": auth.tokens.account_id } : {}),
    },
    body: JSON.stringify({
      model: process.env.CODEX_MODEL ?? "gpt-5.6-terra",
      instructions: "You are an image generator. Always call the image_generation tool exactly once with the user's prompt, unchanged. Do not ask questions.",
      input: [{ type: "message", role: "user", content: [{ type: "input_text", text: prompt }] }],
      tools: [{ type: "image_generation", output_format: "png", size: a.size, quality: "high" }],
      tool_choice: "auto",
      store: false,
      stream: true,
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`image backend ${res.status}: ${txt.slice(0, 300)}`);
  const m = txt.match(/"result":"([A-Za-z0-9+/=]{1000,})"/);
  if (!m) throw new Error("no image in response: " + txt.slice(0, 400));
  return Buffer.from(m[1], "base64");
}

let png;
for (let attempt = 1; ; attempt++) {
  try {
    png = await generate(STYLES[a.style] ? STYLES[a.style] + a.prompt : a.prompt);
    break;
  } catch (e) {
    if (attempt >= 3) throw e;
    console.warn(`retry ${attempt}: ${e.message}`);
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
}

const tmp = a.out.replace(/\.\w+$/, "") + ".src.png";
fs.writeFileSync(tmp, png);
let outType = "image/png";
if (/\.webp$/.test(a.out)) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-vf", "scale='min(1600,iw)':-2", "-c:v", "libwebp", "-quality", "82", a.out]);
  fs.unlinkSync(tmp);
  outType = "image/webp";
} else {
  fs.renameSync(tmp, a.out);
}
console.log(`saved ${a.out} (${fs.statSync(a.out).size} bytes)`);

if (a.target) {
  const site = process.env.CONVEX_SITE_URL;
  const token = process.env.PUBLISH_TOKEN;
  if (!site || !token) throw new Error("CONVEX_SITE_URL and PUBLISH_TOKEN needed to upload");
  const qs = new URLSearchParams({ target: a.target, slug: a.slug ?? "", kind: "image" });
  if (a.caption) qs.set("caption", a.caption);
  const res = await fetch(`${site}/publish/media?${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": outType },
    body: fs.readFileSync(a.out),
  });
  console.log("upload", res.status, (await res.text()).slice(0, 200));
  if (!res.ok) process.exit(1);
}
