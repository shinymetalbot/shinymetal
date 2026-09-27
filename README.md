# ShinyMetal.bot

The owner's manual for the robot age: an independent publication about home and humanoid robots.
Every claim is labeled **Shipped / Preorder / Promise / Rumor / Research**.

- **Frontend**: Astro 7 (server output, `@astrojs/node` standalone) + Tailwind v4 loading the
  approved *Foundry* design system (`src/styles/foundry/`, copied from `../docs/design-system`).
- **Backend**: Convex (`convex/`). Tables: `robots`, `robotStatusEvents`, `promises`, `articles`,
  `subscribers`, `siteMedia`. Pages query Convex at request time through a 60 s in-process cache.
- **Deploy**: Coolify app `udcqismdh8u2z8rg2bydj9a6` builds `Dockerfile` from `main`.
  Runtime env: `CONVEX_URL`, `GA4_ID`.

## Pages

| Route | What |
|---|---|
| `/` | Front page: lead story, latest, robots to follow, reality tracker, promise ledger |
| `/news`, `/news/[slug]` | Signal: decoded / rumor / research / case articles |
| `/robots`, `/robots/[slug]` | Atlas: robot database, legal layer, status history |
| `/compare?r=a,b,c` | Side-by-side compare (up to 4) |
| `/tracker` | Reality tracker |
| `/promises` | Promise ledger |
| `/about`, `/newsletter` | Label definitions, editorial policy, signup |
| `/rss.xml`, `/sitemap.xml`, `/llms.txt` | Feeds (generated from Convex) |
| `POST /api/subscribe` | Newsletter signup (works without JS) |

## Local dev

```bash
npm ci
npx convex dev            # pushes functions to the dev deployment, writes .env.local
npm run dev               # needs CONVEX_URL in env (.env.local has it)
```

## Publish API (Convex HTTP actions)

`Authorization: Bearer $PUBLISH_TOKEN` (set with `npx convex env set PUBLISH_TOKEN …`).
Base URL is the deployment's `.convex.site` host.

| Route | Body |
|---|---|
| `POST /publish/article` | article JSON; upsert by `slug`; needs `type`, `claim`, `title`, `dek`, `body`, `publishedAt`, ≥2 `sources`; rumors need `confidence` |
| `POST /publish/article-status` | `{slug, status: "draft"\|"published"}` |
| `POST /publish/robot` | robot JSON incl. `statusEvents`; upsert by `slug` |
| `POST /publish/status-event` | `{robotSlug, date, status, note, sourceUrl}`; also updates the robot's status |
| `POST /publish/promise` | promise JSON; upsert by `id` |
| `POST /publish/media?target=article\|robot\|site&slug=…&kind=image\|video&caption=…` | raw bytes |

Field shapes: see `seed/*.json` and `convex/schema.ts`.

## Scripts (`node --env-file=.env scripts/…`)

`.env` (gitignored) holds `CONVEX_SITE_URL`, `PUBLISH_TOKEN`, `FAL_API_KEY`.

- `seed.mjs [robots|articles|promises]` loads `seed/*.json` through the publish API.
- `gen-image.mjs --prompt … --out x.webp [--style hero|drawing] [--target … --slug …]` generates with
  GPT-image through the ChatGPT subscription (Codex OAuth, `shared-workspaces/secrets/codex/auth.json`).
- `gen-batch.mjs heroes <dir>` hero images for every seed article.
- `gen-video.mjs --image <url> --prompt … --out x.mp4 [--article slug]` fal.ai Seedance 2.0 loop.
- `upload-media.mjs <file> --target … --slug …` attach an existing file.

Generated media is always captioned as an AI illustration, never as a photo of a real product.
Robots without a real photo fall back to the category line drawings in `public/img/`.

## Newsletter

Signups land in the Convex `subscribers` table. To sync them to a Resend audience, set
`RESEND_API_KEY` (full-access key; the fleet's current key is send-only) and `RESEND_AUDIENCE_ID`
on the Convex deployment, then run `npx convex run newsletter:syncAll --prod`.
