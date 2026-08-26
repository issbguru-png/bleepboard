# Audio playback performance

Measured on production (bleepboard.com, GitHub Pages) on 2026-08-26.

## Where the time actually goes

Clip size is not the problem. Across 523 files: 33KB median, 183KB at p90,
898KB at the largest. The delay is the round trip, not the download.

Fetching a clip GitHub Pages has never served you takes **262-517ms
(median 340ms)**. That was happening *after* the click, because the player
only created its Audio object in the click handler.

## What we changed

**Prefetch on intent** — `src/scripts/player.ts`

The fetch now starts on `pointerover` (mouse), `pointerdown` (touch and pen)
or `focusin` (keyboard) instead of on click. A cursor takes 100-300ms to
travel from hovering a button to pressing it, and that time is now spent
downloading.

Guarded by a `warmed` Set (re-hovering does not refetch) and a concurrency
cap of 3 (dragging across the grid does not open 30 sockets).

No prefetch on page load, deliberately: 33 clips on the homepage is roughly
1MB that nobody asked for, and plenty of visitors are on metered data.

**Service worker media cache** — `public/sw.js`

GitHub Pages sends `Cache-Control: max-age=600` on every file and gives you
no way to change it. Ten minutes is fine for HTML and absurd for MP3s that
never change: a visitor back after lunch re-downloads everything. Cache
Storage is ours to control, so audio now lives there.

Repeat play drops from **340ms to 2ms**, and it survives reloads, sessions
and going offline.

Narrow by design. Only `/audio/`, `/og/` and `/_astro/` are cached. HTML,
sitemaps, `robots.txt`, `ads.txt` and `/api/` always go to the network —
cached HTML would make deploys reach people at an unpredictable time, and a
stale `ads.txt` or sitemap causes real problems.

## Two things that only showed up under measurement

Both of these failed silently. Worth knowing before touching `sw.js`.

**An `<audio>` element does not send the request you would expect.** Chrome
issues it with `mode: no-cors` and `Range: bytes=0-`. Keyed on the raw
`Request`, a hover prefetch and the playback that follows landed in
different cache buckets. The worker now keys on the bare URL string, so
they are one entry.

**Caching a clone of a live response writes nothing.** A media element hangs
up on its own request the moment it has buffered enough to finish. That
cancellation propagates to the clone and `cache.put` rejects. The worker now
reads the body to completion first, so the write does not depend on what the
element does with its copy.

The visible symptom of both: playing a sound cached nothing, while a plain
`fetch()` of the same URL cached fine.

## If clips ever get long

The worker answers the element's range request with a full 200, which means
"range ignored, here is everything". That is fine for one-shot meme clips
with no seek bar. If we ever host something long enough to scrub through,
range requests need to pass through untouched instead.

## Verified in production

- hover, keyboard focus and touch each start the fetch
- a button nobody touched is never fetched
- re-hovering does not refetch
- cold and cached playback report identical durations (nothing truncated)
- cache survives reload
- HTML, sitemap, ads.txt and search-index.json stay out of the cache
