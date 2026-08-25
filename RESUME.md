# Resume notes — paused 2026-08-25

## State
- **Live site** (bleepboard.com) is on commit `ad3fcb6` — 383 sounds, old design. Healthy.
- **Local** is on `c48d17f` — a WIP checkpoint that is **committed but deliberately NOT pushed**.
  Pushing auto-deploys, so nothing goes live until we review.
- Build passes: 935 pages. SEO verified intact across all page types.

## What's in the unpushed checkpoint
| Area | State |
|---|---|
| Batch 7 import | ✅ Done — +71 sounds, new `/animal-soundboard/` hub → **454 sounds, 11 hubs** |
| Blurb expansion | ✅ Done — all 337 thin blurbs 40–59w → **corpus min 60 / avg 85 / max 104 words** |
| Design: homepage | ✅ Done |
| Design: sound page | ✅ Done |
| Design: hubs, trending, new, categories, search, blog, 404, about, dmca | 🟡 Partial — templates updated, **not visually verified** |

## Do this first tomorrow
1. **Visually verify the partially-designed pages** in light + dark, mobile + desktop:
   `/animal-soundboard/`, `/brainrot-soundboard/`, `/trending/`, `/new/`, `/categories/`,
   `/search/`, `/blog/`, `/blog/get-out-meme-explained/`, `/about/`, `/dmca/`, a bogus URL for 404.
   The last design agent was stopped mid-flight — assume these need polish, not that they're finished.
2. On `/search/`, type a query and confirm results render AND play (its JS was rewritten).
3. Then push to deploy.

## Known bugs to fix
- **"New this week" is meaningless.** Every sound shares the same `added` date, so both the
  homepage section and `/new/` fall back to alphabetical order (Aayein, Abhi Maza, Acumalaka…).
  Fix: stagger `added` across `src/content/sounds/*.json` to reflect real import order —
  batch 1 oldest → batch 7 newest. Manifests in `data/import-batch-*.json` give the order.
- Homepage "New this week" and "Trending" show duplicate entries as a result of the above.

## Open items needing the user (not blocked on code)
- **Google Search Console** — still not verified. 454 pages live, zero submitted. Highest-leverage
  remaining task. Add `bleepboard.com` as a *Domain* property → get TXT record → add at Dynadot →
  submit `https://bleepboard.com/sitemap_index.xml`.
- **`www` CNAME** — never saved at Dynadot. Add: `www` → CNAME → `issbguru-png.github.io`.
- **Cloudflare KV** — `PLAYS` binding for the play-count API (`functions/api/play.ts`).
  Play counts silently no-op until then; nothing breaks.

## Next content work
- ~25 validated sounds already sitting in `.cache/audio/` — zero network cost to import.
- Explainer wave 2 candidates (we hold the sound pages, queries are low-difficulty):
  "what is 67", "italian brainrot", "what is Verity", Skibidi, FNAF, mosquito tone.
- Remaining soundboardguys catalog: ~1,200 unimported slugs.

## Pipeline reminders
- `node scripts/preflight.mjs <slug-list.txt>` — parallel validate + cache BEFORE writing copy.
  403 = object not public (permanent, skip). Not rate limiting — 12 concurrent requests verified fine.
- `node scripts/import-sbl.mjs data/import-batch-N.json` — reads from `.cache/audio/` when present.
- Quality gate: importer hard-rejects blurbs under 40 words. Target 70–110.
