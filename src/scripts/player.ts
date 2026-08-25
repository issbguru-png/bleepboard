// One shared <audio>; event delegation over every play control on the page.
// State lives in CSS classes so the visuals (equaliser, glow, progress sweep)
// are pure CSS and cost nothing at runtime.

const PLAY_SELECTOR = '.bleep-play, .hero-play';
const HOST_SELECTOR = '.bleep, .sound-hero';

let audio: HTMLAudioElement | null = null;
let currentBtn: HTMLElement | null = null;

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

// "/" jumps to search — focuses the field if we're already on the search page.
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const field = document.getElementById('q') as HTMLInputElement | null;
  e.preventDefault();
  if (field) field.focus();
  else window.location.href = '/search/';
});
