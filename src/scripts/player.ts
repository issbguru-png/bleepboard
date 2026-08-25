// Single shared audio element; event delegation over every .bleep-play button.
let audio: HTMLAudioElement | null = null;
let currentBtn: HTMLElement | null = null;

function stop() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  currentBtn?.closest('.bleep, .sound-hero')?.classList.remove('playing');
  if (currentBtn) currentBtn.textContent = '▶';
  currentBtn = null;
}

document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('.bleep-play');
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
  // fire-and-forget play count (no-op if the API isn't deployed)
  const slug = btn.dataset.slug ?? src.match(/\/audio\/([a-z0-9-]+)\.mp3/)?.[1];
  if (slug) {
    try {
      navigator.sendBeacon(`/api/play?slug=${slug}`);
    } catch {}
  }
  currentBtn = btn;
  btn.textContent = '⏸';
  btn.closest('.bleep, .sound-hero')?.classList.add('playing');
  audio.onended = stop;
});

// Copy-link buttons
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-copy]');
  if (!btn) return;
  navigator.clipboard.writeText(btn.dataset.copy!).then(() => {
    const prev = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = prev), 1200);
  });
});
