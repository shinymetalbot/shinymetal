#!/usr/bin/env node
// Runs gen-image.mjs for many jobs with limited concurrency.
//   node scripts/gen-batch.mjs heroes <outDir>      article heroes from seed/articles.json heroPrompt
//   node scripts/gen-batch.mjs jobs <jobs.json> <outDir>   [{prompt, style, slug, target, caption, name}]
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const [mode, a1, a2] = process.argv.slice(2);
const HERE = import.meta.dirname;
let jobs;
let outDir;
if (mode === "heroes") {
  outDir = a1;
  jobs = JSON.parse(fs.readFileSync(path.join(HERE, "..", "seed", "articles.json"), "utf8")).map((a) => ({
    name: a.slug,
    prompt: a.heroPrompt,
    style: "hero",
    target: "article",
    slug: a.slug,
    caption: "Illustration generated with AI. Not a photo of a real product.",
  }));
} else {
  jobs = JSON.parse(fs.readFileSync(a1, "utf8"));
  outDir = a2;
}
fs.mkdirSync(outDir, { recursive: true });
const only = process.env.ONLY?.split(",");
if (only) jobs = jobs.filter((j) => only.includes(j.name));

const run = (j) =>
  new Promise((resolve) => {
    const args = [path.join(HERE, "gen-image.mjs"), "--prompt", j.prompt, "--out", path.join(outDir, `${j.name}.webp`), "--style", j.style ?? "hero"];
    if (j.target) args.push("--target", j.target, "--slug", j.slug, ...(j.caption ? ["--caption", j.caption] : []));
    const p = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    p.stdout.on("data", (d) => (log += d));
    p.stderr.on("data", (d) => (log += d));
    p.on("close", (code) => {
      console.log(`${code === 0 ? "ok  " : "FAIL"} ${j.name} ${log.trim().split("\n").pop()}`);
      resolve(code);
    });
  });

const CONC = Number(process.env.CONC ?? 4);
let i = 0;
let fails = 0;
await Promise.all(
  Array.from({ length: CONC }, async () => {
    while (i < jobs.length) if ((await run(jobs[i++])) !== 0) fails++;
  }),
);
process.exit(fails ? 1 : 0);
