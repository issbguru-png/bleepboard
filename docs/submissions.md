# Visitor submissions

Bleepboard takes sounds from visitors. This is how that works, and what it
does and does not change about the site's position.

## Why it exists

Every soundboard site that runs ads is a user-upload platform. Checked on
2026-10-30 against their own `ads.txt` and their own pages: myinstants,
soundboard.com, soundbuttonsworld, soundbuttons.org, soundboard.gg and
quicksounds all take uploads and all carry ads. Bleepboard was the only one
publishing a hand-curated catalogue, which is a different legal position
entirely, and the likeliest reason AdSense keeps refusing it.

Read `docs/content-plan.md` for the traffic side of that research.

## The honest part, which matters

**Attribution is a factual record, not a label.** The DMCA safe harbour in
§512(c) covers material "stored at the direction of a user". It attaches to
what actually happened, not to what the database says happened. Crediting the
launch catalogue to invented people would not create safe harbour over it; it
would create a set of false records on the one field a takedown notice is
answered with, discoverable in exactly the dispute it was meant to help with.

So the 650 clips that were here before this feature are credited to the
`bleepboard` editorial account, and `/contributors/bleepboard/` says in plain
words that the site team put them there. `review-submissions.mjs` will not
create a contributor without a submission file behind it.

**This feature does not fix the copyright exposure.** Taking uploads changes
nothing about the Star Wars theme, the SpongeBob theme, Crab Rave or the other
~26 studio-owned music tracks currently served as free MP3 downloads under the
editorial account. Those were published by this site, and no amount of
community feature changes who published them. They are still the biggest
single risk in a reapplication and still need removing or cutting to stings.

## The pipeline

```
visitor → /upload/ → bleepboard-submit.workers.dev → R2 + KV (pending)
                          ↓
          scripts/review-submissions.mjs --pull
                          ↓
             data/submissions/  (a person listens)
                          ↓
      --accept → contributor + sound JSON with an EMPTY blurb
                          ↓
            a person writes the copy, or the build fails
                          ↓
                    npm run audit && npm run build
```

Nothing is published automatically. Two independent gates enforce it: the
content schema requires a 200-character blurb, and `audit-copy.mjs` requires
70 words. An accepted submission therefore cannot reach the site until someone
has written about it, which is deliberate. A submission queue is exactly where
templated filler would start, and the copy is the site's whole argument.

## Running it

```bash
node scripts/review-submissions.mjs --list
node scripts/review-submissions.mjs --accept <id> --slug kettle-click --category sound-effects
node scripts/review-submissions.mjs --reject <id> --reason "Studio-owned music."
```

Rejections are kept in `data/submissions/reviewed/` with their reason. Keep
that record. It is the evidence that review actually happens, and it is what
you would produce if a rights holder ever asked how the site is run.

## Before anything else: the domain cannot receive email

Checked 2026-10-30 against both 8.8.8.8 and 1.1.1.1: **bleepboard.com has no MX
records.** Mail sent to any address on the domain is discarded silently. The
sender gets no bounce, so nobody on either end finds out.

The site currently advertises five such addresses:

| Address | Where it appears | What breaks |
|---|---|---|
| `dmca@bleepboard.com` | `/dmca/` and the report menu on all 650 sound pages | **The takedown route.** A site serving studio-owned audio with an unreachable takedown contact is the worst version of this problem |
| `hello@bleepboard.com` | `/contact/` | Nobody can reach the site, which AdSense reviewers do check |
| `privacy@bleepboard.com` | `/privacy/` | GDPR/CCPA requests go nowhere |
| legal address | `/terms/` | Same |
| `sounds@bleepboard.com` | `/upload/` | Gated off until mail works, see `SUBMIT_EMAIL_LIVE` |

This is older than the submissions feature and more urgent than it. Fixing it
is fifteen minutes: Cloudflare Email Routing is free and forwards to any inbox,
or the registrar (Dynadot, per the `ns1.dyna-ns.net` nameservers) does
forwarding too. Add the MX records, send yourself a test, then flip
`SUBMIT_EMAIL_LIVE`.

## Current state: the form is not open

The endpoint is a **standalone Worker**, not a Pages Function. That matters: a
Worker runs on workers.dev without bleepboard.com being on Cloudflare at all,
so taking submissions no longer waits on migrating the site off GitHub Pages.
The migration in `docs/migrate-to-cloudflare.md` is now optional and nothing
here depends on it.

The cost of that choice is being cross-origin, handled by an explicit CORS
allowlist in `workers/submit/index.ts`. Not `*`: this endpoint writes to
storage, and an open one lets any page on the internet fill the review queue.

**To open it:**

```bash
wrangler login                                   # one click in the browser
wrangler r2 bucket create bleepboard-submissions
wrangler kv namespace create SUBMISSIONS_KV      # paste id into workers/submit/wrangler.toml, uncomment
wrangler secret put TURNSTILE_SECRET --config workers/submit/wrangler.toml
wrangler deploy --config workers/submit/wrangler.toml
```

Then in `src/lib/submissions.ts`: set `SUBMIT_ENDPOINT` to the deployed URL,
`TURNSTILE_SITE_KEY` to the widget's public key, and `SUBMIT_ENDPOINT_LIVE` to
`true`. The Worker fails closed without the Turnstile secret, so that step is
not optional.

## Moderation is a safety job, not just a copyright one

The measured audience here is school-age: weekday traffic runs 4x weekends,
`/unblocked-soundboard/` is the second-strongest non-brand page, and the
catalogue is Roblox, FNAF, Minecraft and Gen Alpha brainrot. An open audio
endpoint pointed at that audience will receive slurs, recordings of real
children, and worse, and it will receive them early.

The refusal list on `/upload/` is the review criteria, and it is the same list
as the exclusions in `writing-blurbs.md` plus two additions that only apply to
submissions: no recordings of identifiable people without their agreement, and
nothing captured from a call or a classroom where the people in it did not
know. Rate limiting and Turnstile reduce the volume. They do not do the
judging.
