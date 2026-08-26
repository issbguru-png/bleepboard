/* Bleepboard service worker.
 *
 * Exists for one reason: GitHub Pages sends `Cache-Control: max-age=600` on
 * every file and gives you no way to change it. Ten minutes is fine for HTML
 * and absurd for 40MB of MP3s that never change — a visitor who comes back
 * after lunch re-downloads every clip they press.
 *
 * This worker keeps audio and share cards in Cache Storage, which we control.
 * Second play of any sound is instant, survives across sessions, and works
 * offline.
 *
 * Deliberately NARROW. It caches immutable-in-practice media only:
 *   - /audio/*  MP3s. Never change under a given filename in practice.
 *   - /og/*     share cards.
 *   - /_astro/* content-hashed by the build, so genuinely immutable.
 *
 * It does NOT touch HTML, sitemaps, robots.txt, ads.txt or /api/. Caching HTML
 * would mean a deploy takes an unpredictable amount of time to reach people,
 * and stale sitemaps or ads.txt would actively cause problems. Those keep going
 * to the network every time.
 */

const VERSION = 'v1';
const MEDIA_CACHE = `bleepboard-media-${VERSION}`;

/** Cap so a heavy user doesn't grow an unbounded cache on a small device. */
const MAX_ENTRIES = 400;

const CACHEABLE = [/^\/audio\//, /^\/og\//, /^\/_astro\//];

self.addEventListener('install', (event) => {
  // Take over promptly; there is no old worker whose state we need to respect.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions of this worker.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('bleepboard-media-') && n !== MEDIA_CACHE)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

/** Keep the cache from growing without limit: oldest-inserted out first. */
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;
  for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) {
    await cache.delete(k);
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only ever interfere with same-origin GETs. Never touch the play beacon,
  // analytics, or anything cross-origin.
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (!CACHEABLE.some((re) => re.test(url.pathname))) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(MEDIA_CACHE);

      // Normalise the cache key to the bare URL.
      //
      // This matters more than it looks. An <audio> element does not make the
      // request you would expect: Chrome sends it with `mode: no-cors` and
      // `Range: bytes=0-`. Keyed on the raw Request, the clip an element pulls
      // and the clip our hover prefetch pulls land in different buckets — or,
      // as happened here, in no bucket at all, because the range response is
      // not a plain 200 and cache.put quietly rejects it.
      //
      // One string key, so a prefetch and a playback are the same entry.
      const key = url.href;

      const hit = await cache.match(key);
      if (hit) return hit;

      // Ask for the whole file rather than passing the element's Range through.
      // Answering a range request with a full 200 is allowed — it means "range
      // ignored, here is everything" — and these are one-shot meme clips: 33KB
      // at the median, 898KB at the very largest, with no seek bar anywhere in
      // the UI. If we ever host something long enough to scrub through, this
      // needs to pass ranges through instead.
      const res = await fetch(key, { credentials: 'omit' });
      if (!(res.ok && res.status === 200)) return res;

      // Read the body to completion before writing it, rather than caching a
      // clone of a live stream.
      //
      // A media element hangs up on its own request the moment it has buffered
      // enough to finish playing. That cancellation propagates to the clone,
      // cache.put rejects, and the entry is never written — which is why an
      // <audio> play alone cached nothing while a plain fetch of the same URL
      // cached fine. Buffering first makes the write independent of what the
      // element does with its copy.
      //
      // The cost is that the element waits for the whole file instead of
      // streaming. Acceptable here: 33KB at the median, 898KB at the largest,
      // and a hover has usually paid for it already.
      const buf = await res.arrayBuffer();
      const full = new Response(buf, {
        status: 200,
        headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg' },
      });

      cache.put(key, full.clone()).then(() => trim(cache)).catch(() => {});
      return full;
    })()
  );
});
