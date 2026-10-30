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
visitor → /submit/ → functions/api/submit.ts → R2 + KV (pending)
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

## Current state: the form is not open

`functions/api/submit.ts` is Cloudflare code and the site is on GitHub Pages,
where Functions do not run. This is the same trap `/api/play` fell into: wired
up, shipped, and silently 404ing in production.

So `SUBMIT_ENDPOINT_LIVE` in `src/lib/submissions.ts` is `false`, and `/submit/`
shows an email route and says the upload form is not open yet. It does not
render a form that posts into nothing and then tells a child their clip is
under review when it was dropped by a 404.

**To open it:**

1. Do the migration in `docs/migrate-to-cloudflare.md`.
2. `wrangler r2 bucket create bleepboard-submissions`
3. `wrangler kv namespace create SUBMISSIONS_KV`, paste the id into `wrangler.toml`
4. Create a Turnstile widget, `wrangler pages secret put TURNSTILE_SECRET`,
   and put the site key in `src/lib/submissions.ts`
5. Set `SUBMIT_ENDPOINT_LIVE = true`

The endpoint fails closed without the Turnstile secret, so step 4 is not
optional.

## Moderation is a safety job, not just a copyright one

The measured audience here is school-age: weekday traffic runs 4x weekends,
`/unblocked-soundboard/` is the second-strongest non-brand page, and the
catalogue is Roblox, FNAF, Minecraft and Gen Alpha brainrot. An open audio
endpoint pointed at that audience will receive slurs, recordings of real
children, and worse, and it will receive them early.

The refusal list on `/submit/` is the review criteria, and it is the same list
as the exclusions in `writing-blurbs.md` plus two additions that only apply to
submissions: no recordings of identifiable people without their agreement, and
nothing captured from a call or a classroom where the people in it did not
know. Rate limiting and Turnstile reduce the volume. They do not do the
judging.
