export const SITE = {
  name: 'Bleepboard',
  url: 'https://bleepboard.com',
  tagline: 'Instant sound buttons & meme soundboard',
  description:
    'Free meme soundboard with instant sound buttons. Play meme sounds, sound effects and viral clips, then download the MP3 free — no signup, no install.',
  twitter: '@bleepboard',
  /** Default social share card. 1200x630, lives in public/. */
  ogImage: '/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Bleepboard — free meme soundboard and instant sound buttons',
  /** Square mark, used as the Organization logo in JSON-LD. */
  logo: '/apple-touch-icon.png',
};

export function hubPath(categorySlug: string): string {
  return `/${categorySlug}-soundboard/`;
}

export function soundPath(slug: string): string {
  return `/sound/${slug}/`;
}

export function canonical(pathname: string): string {
  // normalize to trailing slash, absolute
  let p = pathname.endsWith('/') ? pathname : pathname + '/';
  return SITE.url + p;
}

/** Site-relative path -> absolute URL. Absolute inputs pass through untouched,
 *  so a caller can hand us either. Social scrapers reject relative URLs. */
export function absolute(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return SITE.url + (path.startsWith('/') ? path : '/' + path);
}

export function fmtDuration(sec: number): string {
  return `${sec.toFixed(1).replace(/\.0$/, '')}s`;
}

// --- title / description shaping -----------------------------------------
// Google truncates titles around 60 characters and descriptions around 160.
// Rather than write one template per page type and hope every name fits, each
// page type hands us a ladder of candidates, longest and richest first, and we
// take the first one that survives the cut. Names on this site run from "6 7"
// to "Lie Detector (Determined That Was a Lie)", so a fixed template is always
// either too long for the long names or wasteful for the short ones.

export const TITLE_MAX = 60;
export const DESC_MAX = 158;
export const DESC_MIN = 120;

/** First candidate that fits, else the last one (assumed shortest). */
export function pickTitle(candidates: string[], max = TITLE_MAX): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
}

/** Trim to `max` on a word boundary, never mid-word, and never leaving
 *  dangling punctuation. Returns the whole string when it already fits. */
export function clamp(text: string, max = DESC_MAX): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const at = cut.lastIndexOf(' ');
  return cut.slice(0, at > 0 ? at : max).replace(/[\s,;:.—–-]+$/, '');
}

/**
 * Join sentence-ish fragments into a description, dropping empties and
 * stopping before `max`. Each part keeps its own terminal punctuation.
 *
 * A part that does not fit whole is not simply discarded: dropping it wholesale
 * is what left descriptions stranded at ~108 characters whenever the only
 * available material happened to be one long sentence. If there is a useful
 * amount of room left, the part is clamped into it instead; only a part with
 * nowhere meaningful to go is skipped.
 */
export function buildDescription(parts: (string | undefined | null)[], max = DESC_MAX): string {
  const MIN_TAIL = 40; // below this a clamped fragment reads as truncation noise
  let out = '';
  for (const raw of parts) {
    const part = (raw ?? '').replace(/\s+/g, ' ').trim();
    if (!part) continue;
    const next = out ? `${out} ${part}` : part;
    if (next.length <= max) {
      out = next;
      continue;
    }
    const room = max - (out ? out.length + 1 : 0);
    if (room >= MIN_TAIL) {
      const tail = clamp(part, room);
      // Only take the clamp if it ends somewhere a reader can live with.
      if (tail.length >= MIN_TAIL) out = out ? `${out} ${tail}` : tail;
    }
    break;
  }
  // Nothing fit at all — fall back to a clean clamp of the first non-empty part.
  if (!out) out = clamp((parts.find((p) => p && p.trim()) ?? '') as string, max);
  return out;
}

/** ISO-8601 duration. Whole seconds: the fractional form (`PT3.6S`) is legal
 *  ISO-8601 but several consumers, Google's parser included, only reliably
 *  read integers. Second granularity still describes the clip honestly. */
export function isoDuration(seconds: number): string {
  return `PT${Math.max(1, Math.round(seconds))}S`;
}
