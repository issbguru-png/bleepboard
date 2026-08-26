# Project state — updated 2026-08-26

## Where things are

**Live:** bleepboard.com — 523 sounds, 11 category hubs, 13 articles, 1,080 pages.
Deploys automatically from `main` via GitHub Pages on every push.

**Analytics:** GA4 live (`G-RE0Q1R4421`) with Consent Mode v2 — denied by default in
EEA/UK/CH until a CMP is answered, granted elsewhere.

**Not indexed.** No Search Console property exists, so none of this is in Google yet.
This is the single biggest open item; everything else compounds only after it.

## Stack

Astro SSG → GitHub Pages. No framework, no CSS library, no webfont. One localStorage
key (`bleepboard:favourites`). System fonts only. GA4 is the only third-party script;
it loads behind Consent Mode v2 (see `src/lib/monetization.ts`).

## Content pipeline

```sh
node scripts/preflight.mjs data/candidates-N.txt   # validate + cache audio first
node scripts/import-sbl.mjs data/import-batch-N.json
npm run audit                                      # copy audit — do not skip
npm run build
```

- **[docs/writing-blurbs.md](docs/writing-blurbs.md)** is the copy SOP. Read it before
  writing any blurb. `npm run audit` enforces it and exits non-zero on regression.
- `data/import-batch-7.json` is the quality benchmark for manifests.
- **56 sounds are already validated and cached** in `.cache/audio/` — zero network
  cost, they just need copy written.

## Known limitation: play counts don't work

`src/scripts/player.ts` fires a beacon at `/api/play`, which is a **Cloudflare Pages
Function** — but this site deploys to **GitHub Pages**, which cannot execute it.
`POST /api/play` returns 405 live. Nothing has ever been counted.

The `plays` field in each sound JSON is an **editorial popularity weight** used only
for ordering. It is not measured data and must never be displayed as a play count.
Fabricated per-sound counts and a "777,755 plays counted" aggregate were removed on
2026-08-26 for exactly this reason.

To get real counts you would have to migrate hosting to Cloudflare Pages
(`.github/workflows/deploy.yml` already exists, set to manual-only) and provision the
`PLAYS` KV binding. Optional — nothing is broken without it.

## Open items needing facts only the owner has

These are marked with TODOs in source (stripped at build) — grep `TODO` in
`src/pages/privacy.astro` and `src/pages/dmca.astro`.

**Blocking before running ads:**
1. **A certified consent platform (CMP)** for EEA/UK traffic. Google requires one for
   AdSense. Mediavine bundles one; bare AdSense does not. Hard blocker.
2. **Legal entity name + postal address** — GDPR Art. 13 requires controller identity.
3. **DMCA designated agent block** — name, address, contact.
4. **An effective date** on the privacy policy.
5. ~~Child-directed treatment~~ — **decided 2026-08-26: standard treatment
   (`CHILD_DIRECTED = false`)**. Deliberate, not a default. Revisit if GA4 shows the
   audience skewing heavily under 13.
6. **CPRA "Do Not Sell or Share" footer link**, once ad partners make it applicable.

Ads are not live. The whole advertising section of the privacy policy is gated behind
`ADS_LIVE = false` in `src/pages/privacy.astro` and currently renders a "Not active"
notice. Flip that constant when ads launch.

**Also outstanding:**
- Zam Zam Gillani's real bio — `src/pages/about.astro` has a `TODO` placeholder; the
  current copy is mission-focused stand-in text.

## Content backlog

- 56 cached sounds ready to import (see above).
- Enough adjacent material for a `/cartoon-soundboard/` hub with real headroom.
- Seven wave-1 blog articles run 322–483 words against wave-2's 687–793. Worth
  expanding to match.
- ~1,100 unimported slugs remain in the source catalogue.
