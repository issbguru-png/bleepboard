// One shared <audio>; event delegation over every play control on the page.
// State lives in CSS classes so the visuals (equaliser, glow, progress sweep)
// are pure CSS and cost nothing at runtime.
//
// LATENCY: the clip used to start downloading on `click`, so every first press
// paid a full round trip (~250ms median from the UK, worse on school wifi).
// We now start the fetch on the earliest honest signal of intent — pointer
// entering the button on a mouse, or the finger going down on a touchscreen —
// which is 100-300ms before `click` fires. By the time the press completes the
// bytes are usually already in the HTTP cache.
//
// We do NOT prefetch on page load: 33 clips on the homepage is ~1MB of audio
// nobody asked for, which on a metered phone connection is a worse trade than
// the latency it saves.

const PLAY_SELECTOR = '.bleep-play, .hero-play';
const HOST_SELECTOR = '.bleep, .sound-hero';

let audio: HTMLAudioElement | null = null;
let currentBtn: HTMLElement | null = null;

/** Sources we've already warmed, so a hover-heavy user doesn't refetch. */
const warmed = new Set<string>();
/** Cap concurrent warm-ups; a fast drag across a grid shouldn't open 30 sockets. */
let warming = 0;

function warm(src: string | undefined) {
  if (!src || warmed.has(src) || warming > 3) return;
  warmed.add(src);
  warming++;
  // fetch() rather than a second Audio element: it populates the same HTTP
  // cache the <audio> will read from, without allocating a decoder we'd throw
  // away, and without any risk of a stray element playing.
  fetch(src, { mode: 'same-origin', priority: 'low' } as RequestInit)
    .catch(() => warmed.delete(src))
    .finally(() => { warming--; });
}

// Mouse: hovering a button is a strong signal and buys the most time.
document.addEventListener('pointerover', (e) => {
  const el = e.target as HTMLElement | null;
  if (!el?.closest) return;
  const btn = el.closest<HTMLElement>(PLAY_SELECTOR);
  if (btn && (e as PointerEvent).pointerType === 'mouse') warm(btn.dataset.src);
}, { passive: true });

// Touch/pen: no hover, but pointerdown still lands well before click.
document.addEventListener('pointerdown', (e) => {
  const el = e.target as HTMLElement | null;
  if (!el?.closest) return;
  warm(el.closest<HTMLElement>(PLAY_SELECTOR)?.dataset.src);
}, { passive: true });

// Keyboard users get the same benefit when a button takes focus.
document.addEventListener('focusin', (e) => {
  const el = e.target as HTMLElement | null;
  if (!el?.closest) return;
  warm(el.closest<HTMLElement>(PLAY_SELECTOR)?.dataset.src);
}, { passive: true });

function host(btn: HTMLElement | null): HTMLElement | null {
  return btn?.closest<HTMLElement>(HOST_SELECTOR) ?? null;
}

function stop() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  host(currentBtn)?.classList.remove('playing');
  currentBtn?.setAttribute('aria-pressed', 'false');
  currentBtn = null;
}

document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>(PLAY_SELECTOR);
  if (!btn) return;
  const src = btn.dataset.src;
  if (!src) return;

  if (currentBtn === btn) {
    stop();
    return;
  }
  stop();

  audio ??= new Audio();
  audio.src = src;
  audio.play().catch(() => {});

  // a short tick makes the press feel physical on touch devices
  try {
    navigator.vibrate?.(12);
  } catch {}

  // fire-and-forget play count (no-op if the API isn't deployed)
  const slug = btn.dataset.slug ?? src.match(/\/audio\/([a-z0-9-]+)\.mp3/)?.[1];
  if (slug) {
    try {
      navigator.sendBeacon(`/api/play?slug=${slug}`);
    } catch {}
  }

  currentBtn = btn;
  btn.setAttribute('aria-pressed', 'true');
  const el = host(btn);
  el?.classList.add('playing');

  // Prefer the real decoded duration for the progress sweep; the build-time
  // value from the content data is the fallback and is usually identical.
  audio.onloadedmetadata = () => {
    if (el && audio && Number.isFinite(audio.duration) && audio.duration > 0) {
      el.style.setProperty('--dur', `${audio.duration}s`);
    }
  };
  audio.onended = stop;
});

// Copy-to-clipboard buttons (page links, embed code)
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-copy]');
  if (!btn) return;
  const label = btn.querySelector<HTMLElement>('[data-copy-label]') ?? btn;
  navigator.clipboard.writeText(btn.dataset.copy!).then(() => {
    if (btn.dataset.copyBusy) return;
    btn.dataset.copyBusy = '1';
    const prev = label.textContent;
    label.textContent = 'Copied!';
    setTimeout(() => {
      label.textContent = prev;
      delete btn.dataset.copyBusy;
    }, 1400);
  });
});

// "/" focuses the homepage search field, or sends you to the homepage to use it.
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const field = document.getElementById('q') as HTMLInputElement | null;
  e.preventDefault();
  if (field) field.focus();
  else window.location.href = '/';
});

// Service worker: the only way to get real audio caching on GitHub Pages,
// which hard-codes `max-age=600` on every asset. Ten minutes means a returning
// visitor re-downloads clips they already have. The worker keeps them in Cache
// Storage instead, so a second visit plays instantly and offline.
// `isSecureContext` is the correct gate: it is true on https AND on localhost,
// where service workers are also permitted. Checking protocol === 'https:'
// silently disabled the worker during local testing.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Nothing to do — the site works fine without it.
    });
  });
}
