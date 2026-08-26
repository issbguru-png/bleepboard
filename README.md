# Bleepboard

Instant sound buttons & meme soundboard — bleepboard.com

Astro SSG. Every page statically rendered. Content lives in git as content collections.

## Commands

```sh
npm run dev        # dev server
npm run build      # static build → dist/
npm run preview    # serve dist/ locally
```

## Writing copy — read this before importing sounds

**[docs/writing-blurbs.md](docs/writing-blurbs.md)** is the style guide. Every
sound page carries hand-written copy, and that is the entire competitive
argument of this site — rival soundboards ship templated filler.

In Aug 2026 all 523 blurbs had to be rewritten because they read as
machine-written: 517 em-dashes, 74 blurbs opening with the identical
`Name — appositive` shape, 74 "which is exactly why". The style guide plus the
audit below exist so that doesn't recur.

```sh
npm run audit        # sound blurbs — exits non-zero on a regression
npm run audit:all    # + blog and category copy
npm run check        # audit, then build
```

Run `npm run audit` after every import. It enforces 70–110 words, catches banned
constructions, blocks duplicate blurbs and shared openings, and watches em-dash
density (target ~0.25–0.40 per blurb — **zero is also a tell**).

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
