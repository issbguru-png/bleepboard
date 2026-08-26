# Migrating from GitHub Pages to Cloudflare Pages

## Why

Three problems, one migration:

1. **Audio cold-start.** Measured against competitors on 2026-08-26, first-press
   latency was 1,453 ms for us against 1,039 ms for soundboardguys.com, who
   serve audio from a dedicated media CDN. We serve from GitHub Pages.
2. **Cache headers we cannot control.** GitHub Pages sends `max-age=600` on
   everything. 40 MB of MP3s that never change are re-downloaded every ten
   minutes by returning visitors. `public/_headers` fixes this the moment we
   move, and is inert until then.
3. **Play counts have never worked.** `functions/api/play.ts` is a Cloudflare
   Pages Function. GitHub Pages cannot execute it, so `POST /api/play` returns
   405 and always has. This is not a missing KV binding — the endpoint is not
   deployed at all.

Also gained: bandwidth headroom (GitHub Pages soft-limits at 100 GB/month),
and per-route control if the site ever needs it.

## What does NOT change

URLs, content, the repo, the build. Same domain, same paths, same HTML. From
Google's point of view this is a hosting swap, not a migration — there are no
redirects to manage and no URL mapping. SEO risk is low, which is why doing it
now, at zero traffic, is cheaper than doing it later.

## Prerequisites (owner only — these need your login)

- A Cloudflare account. Free tier is enough.
- Access to Dynadot DNS for bleepboard.com.

## Runbook

### 1. Authenticate

```bash
npx wrangler login
```

Opens a browser for OAuth. Must be done by the account holder.

### 2. Create the Pages project

Connect the GitHub repo through the Cloudflare dashboard:

- **Pages → Create → Connect to Git →** `issbguru-png/bleepboard`
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

Cloudflare will build and give you a `*.pages.dev` URL. **Verify the site on
that URL before touching DNS** — this is the step that makes the cutover safe.

Check specifically:
- Sounds play
- `curl -I https://<project>.pages.dev/audio/vine-boom.mp3` shows
  `cache-control: public, max-age=2592000` (proves `_headers` applied)
- `/embed/vine-boom/` still loads and is iframeable

### 3. Create the KV namespace for play counts

```bash
npx wrangler kv namespace create PLAYS
```

Paste the printed id into `wrangler.toml` and uncomment the `[[kv_namespaces]]`
block. Then bind it in the dashboard as well: **Pages → Settings → Functions →
KV namespace bindings**, variable name `PLAYS`.

Verify:

```bash
curl -X POST "https://<project>.pages.dev/api/play?slug=vine-boom"   # expect 204
```

If that returns 204 rather than 405, the Function is finally live.

### 4. Point DNS at Cloudflare

Two options.

**Option A — full nameserver transfer (recommended).** Cloudflare gives you two
nameservers; replace Dynadot's with them. You gain their CDN and analytics on
everything. Takes up to 24h to propagate but usually far less.

**Option B — CNAME only.** Keep Dynadot DNS, add the records Cloudflare's
custom-domain screen shows. Faster to reverse, fewer benefits.

Add `bleepboard.com` and `www.bleepboard.com` under **Pages → Custom domains**.

### 5. Verify before declaring done

```bash
curl -sI https://bleepboard.com/audio/vine-boom.mp3 | grep -i cache-control
# want: public, max-age=2592000

for u in http://bleepboard.com https://www.bleepboard.com https://bleepboard.com; do
  curl -s -o /dev/null -w "$u -> %{http_code} %{redirect_url}\n" "$u"
done
# all should resolve to https://bleepboard.com

curl -X POST "https://bleepboard.com/api/play?slug=vine-boom" -o /dev/null -w "%{http_code}\n"
# want 204
```

Then in Search Console: **Settings → Crawl stats** for a few days. A hosting
change should show no increase in fetch errors. If it does, roll back.

### 6. Switch the deploy workflow

`.github/workflows/pages.yml` (GitHub Pages) and
`.github/workflows/deploy.yml` (Cloudflare, currently `workflow_dispatch` only)
both exist. Once Cloudflare's own Git integration is building, **disable
`pages.yml`** so two systems aren't racing to deploy the same commit.

If you prefer GitHub Actions to drive the Cloudflare deploy instead of
Cloudflare's Git integration, add repo secrets `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` and re-enable the push trigger in `deploy.yml`.

## Rollback

DNS back to the GitHub Pages A records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

and `www` CNAME to `issbguru-png.github.io`. The GitHub Pages deployment stays
intact throughout, so rollback is a DNS change and nothing else.

## After the move

- Re-run the audio latency measurement and compare against the 1,453 ms
  baseline.
- `src/scripts/player.ts` already sends the play beacon; once KV is bound,
  `scripts/sync-plays.mjs` can pull real counts back into the content files and
  the trending order stops being an editorial estimate.
- Update `RESUME.md` and the `plays` comment in `src/content.config.ts`, which
  currently states plainly that nothing counts plays.
