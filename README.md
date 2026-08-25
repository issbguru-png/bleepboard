# Bleepboard

Instant sound buttons & meme soundboard — bleepboard.com

Astro SSG. Every page statically rendered. Content lives in git as content collections.

## Commands

```sh
npm run dev        # dev server
npm run build      # static build → dist/
npm run preview    # serve dist/ locally
```

## Adding a sound (the 48-hour trend pipeline)

```sh
node scripts/add-sound.mjs \
  --title "Vine Boom" \
  --category meme \
  --tags "boom,vine,dramatic" \
  --audio ~/Downloads/vine-boom.mp3 \
  --blurb "60-120 words of unique copy about the sound and its origin..." \
  --origin "One-liner on where the sound comes from"
```

The CLI transcodes audio to MP3 into `public/audio/`, measures duration, and writes
`src/content/sounds/{slug}.json`. It **rejects blurbs under 40 words** — the quality
gate is the anti-collapse insurance; no thin pages ship, ever.

## Daily trend digest

```sh
node scripts/trend-monitor.mjs
```

Pulls Google Trends rising queries and flags sound-adjacent candidates. Wire into
cron / GitHub Actions for a daily digest. Candidate → `add-sound.mjs` + a blog
explainer within 48h.

## Content model

- `src/content/sounds/*.json` — one file per sound. Schema enforces unique blurb (min ~40 words).
- `src/content/categories/*.json` — hub pages at `/{slug}-soundboard/` with intro copy + FAQ (FAQPage schema).
- `src/content/blog/*.md` — meme explainers and guides (Article schema).

## SEO plumbing (already wired)

- Segmented sitemaps: `/sitemap_index.xml` → sounds / categories / blog / pages, regenerated every build
- Canonicals + OG on every page (`src/layouts/Base.astro`)
- `AudioObject` + `BreadcrumbList` JSON-LD on sound pages; `FAQPage` on hubs; `Article` on blog
- `/embed/{slug}/` — embeddable button iframes (noindexed; the snippet on each sound page links back = passive backlinks)
- `robots.txt` blocks `/embed/` and `/api/`

## Index-hygiene doctrine

1. Nothing thin gets indexed. The CLI quality gate + schema minimums enforce this.
2. Deleted sounds → real 404s (remove the JSON + audio; rebuild).
3. Future UGC (user boards) ships **noindexed by default**; indexation is earned.

## Deploy

Static output — deploy `dist/` to Cloudflare Pages (recommended: connect repo,
build command `npm run build`, output `dist`).
