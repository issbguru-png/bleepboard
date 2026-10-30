#!/usr/bin/env node
/**
 * Rights audit: which clips are a monetisation and takedown risk, and why.
 *
 *   node scripts/audit-rights.mjs              # the report
 *   node scripts/audit-rights.mjs --tier 1     # just one tier
 *   node scripts/audit-rights.mjs --json       # machine-readable, for the fixer
 *
 * Why this exists: AdSense refused this site repeatedly for "low value
 * content", which is Google's catch-all label. The content is not the problem
 * (647 hand-written blurbs is more original text than any competitor carries).
 * What is different about this site is that it publishes studio-owned audio as
 * free MP3 downloads under its own name, rather than hosting what users
 * uploaded. Google's ads policy names "mp3 music" explicitly.
 *
 * The site's own rule in docs/writing-blurbs.md already says it:
 *   "Short game/system/TV stings are fine; complete songs are not."
 * This script measures how far the catalogue has drifted from that.
 *
 * ── THE TIERS ───────────────────────────────────────────────────────────────
 * 1  Commercial music recording. A film, TV or game theme, or a released
 *    track. Owned by a studio or a label, recognisable in a few seconds, and
 *    the category Google names. Remove, or cut to a sting so short it stops
 *    being the recording.
 * 2  Studio-owned non-music audio: dialogue, a character's voice, a scored
 *    sting. Lower risk than music, still somebody's property, and still worth
 *    keeping short.
 * 3  Functional game or system audio. A UI blip, a notification, a mob noise.
 *    This is what the house rule means by a sting, and what every competitor
 *    carries without trouble.
 * 4  Original or free: synthesis, field recordings, public domain.
 *
 * Tiering is a first pass from the metadata, not a legal opinion. A human
 * reads the list. The point is to replace "about 26 I think" with a list.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(root, 'src/content/sounds');
const RED = '\x1b[31m', YEL = '\x1b[33m', GRN = '\x1b[32m', DIM = '\x1b[2m', CYA = '\x1b[36m', OFF = '\x1b[0m';

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const onlyTier = argv.includes('--tier') ? Number(argv[argv.indexOf('--tier') + 1]) : null;

/** Rights holders whose name in an origin line settles the question. */
const HOLDERS = [
  'disney', 'pixar', 'nintendo', 'nickelodeon', 'paramount', 'netflix', 'warner',
  'sony', 'universal', 'monstercat', 'mojang', 'microsoft', 'apple', 'valve',
  'riot games', 'blizzard', 'sega', 'bandai', 'toei', 'hasbro', 'mattel',
  'lucasfilm', 'marvel', 'dreamworks', 'cartoon network', 'hbo', 'bbc', 'mtv',
  'rockstar', 'epic games', 'activision', 'ubisoft', 'konami', 'capcom',
  'square enix', 'astley baker', 'david production', 'toby fox', 'lsplash',
];

/** Words that mark the clip as a piece of music rather than a sound.
 *
 *  Matched on word boundaries, which is not fussiness: as plain substrings
 *  "single" caught "a single crack" on gunshot, "rap" caught "earrape", and
 *  "song" caught "birdsong". An audit that flags meow as a commercial record
 *  is an audit nobody reads twice. "single" is gone entirely, since it almost
 *  never means a release here. */
const MUSIC = [
  'theme', 'song', 'music', 'track', 'album', 'soundtrack', 'anthem',
  'hook', 'chorus', 'bassline', 'jingle', 'composed by', 'scored by', 'remix',
  'opening theme', 'ending theme', 'drill', 'rap', 'funk', 'lyrics', 'sung',
];

/** Markers that the audio is ours or free to use. */
const CLEAR = [
  'original synthesis', 'original generated', 'generated pink-noise', 'field recording',
  'public domain', 'originally recorded for this site', 'original 8-bit', 'precise synthesis',
  'generic recording', 'a generic', 'studio recording of a',
];

const hay = (s) => `${s.id} ${s.title} ${s.origin ?? ''} ${(s.tags ?? []).join(' ')}`.toLowerCase();

/** Whole-word match. A phrase like "composed by" matches as a phrase.
 *  No word in either list contains a regex metacharacter, so the words go in
 *  as written and the boundaries are the only pattern here. */
const hit = (list, h) => list.filter((w) => new RegExp(`(^|[^a-z])${w}($|[^a-z])`).test(h));

/** "Whale song" and "birdsong" are not releases. Without this, a hydrophone
 *  recording lands in the commercial-music pile and the list loses its
 *  credibility with the reader on the first screen. */
const NATURE_SONG = /(whale|bird|birds|cricket|frog|wolf)\s+song|birdsong|dawn chorus/;

function classify(s) {
  const h = hay(s);
  if (NATURE_SONG.test(h)) return { tier: 4, why: 'field recording of an animal' };
  const clear = hit(CLEAR, h);
  const holders = hit(HOLDERS, h);
  const music = hit(MUSIC, h);

  // Something we made or recorded ourselves, with nobody else's name on it.
  if (clear.length && !holders.length && !music.length) {
    return { tier: 4, why: clear[0] };
  }
  // Music is the category the policy names, so it outranks everything else.
  if (music.length && (holders.length || s.duration >= 8)) {
    return {
      tier: 1,
      why: `music (${music[0]})${holders.length ? ` · ${holders[0]}` : ''}${s.duration >= 8 ? ` · ${s.duration}s` : ''}`,
    };
  }
  if (holders.length) {
    // A named rights holder plus real length reads as a clip of their work;
    // a second or two of a UI blip does not, and that is the house exception.
    return s.duration >= 6
      ? { tier: 2, why: `${holders[0]} · ${s.duration}s` }
      : { tier: 3, why: `${holders[0]} · short (${s.duration}s)` };
  }
  // Below about three seconds there is no recording left to infringe: it is a
  // sting, which is the exception the house rule already carves out. A 0.5s
  // jingle sitting in the "commercial music" pile is how a list gets ignored.
  if (music.length) {
    return s.duration >= 3
      ? { tier: 2, why: `music (${music[0]}) · ${s.duration}s` }
      : { tier: 3, why: `music-ish but ${s.duration}s, a sting` };
  }
  if (clear.length) return { tier: 4, why: clear[0] };
  return { tier: 3, why: 'no rights holder named' };
}

const sounds = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ id: basename(f, '.json'), ...JSON.parse(readFileSync(resolve(DIR, f), 'utf8')) }))
  .map((s) => ({ ...s, ...classify(s) }))
  .sort((a, b) => a.tier - b.tier || b.duration - a.duration);

if (asJson) {
  const out = onlyTier ? sounds.filter((s) => s.tier === onlyTier) : sounds;
  // No process.exit() here. Node does not flush an async stdout write before
  // exiting, so exiting straight after a console.log this size truncates the
  // JSON the moment it is piped anywhere. Falling off the end of the module
  // lets the write drain.
  process.stdout.write(
    JSON.stringify(
      out.map(({ id, title, tier, why, duration, origin }) => ({ id, title, tier, why, duration, origin })),
      null,
      2
    ) + '\n'
  );
}

if (!asJson) {

const TIER_LABEL = {
  1: `${RED}TIER 1  commercial music recording${OFF}  — remove, or cut until it is not the record any more`,
  2: `${YEL}TIER 2  studio-owned audio${OFF}  — keep short, review case by case`,
  3: `${CYA}TIER 3  functional game/system audio${OFF}  — the house rule's "sting", fine`,
  4: `${GRN}TIER 4  original or free${OFF}  — no exposure`,
};

let totalSeconds = 0;
for (const tier of [1, 2, 3, 4]) {
  if (onlyTier && tier !== onlyTier) continue;
  const group = sounds.filter((s) => s.tier === tier);
  console.log(`\n${TIER_LABEL[tier]}   ${DIM}(${group.length})${OFF}`);
  if (tier <= 2) {
    for (const s of group) {
      totalSeconds += s.duration;
      console.log(`  ${String(s.duration).padStart(5)}s  ${s.id.padEnd(30)} ${DIM}${s.why}${OFF}`);
      if (tier === 1) console.log(`           ${DIM}${(s.origin ?? '').slice(0, 92)}${OFF}`);
    }
  } else {
    console.log(`  ${DIM}${group.slice(0, 8).map((s) => s.id).join(', ')}${group.length > 8 ? ` … and ${group.length - 8} more` : ''}${OFF}`);
  }
}


const t1 = sounds.filter((s) => s.tier === 1);
const t2 = sounds.filter((s) => s.tier === 2);
console.log(`\n${DIM}──────────────────────────────────────────────────────────${OFF}`);
console.log(`  ${sounds.length} clips. ${RED}${t1.length} tier 1${OFF}, ${YEL}${t2.length} tier 2${OFF}, ${sounds.length - t1.length - t2.length} fine.`);
console.log(`  Tier 1 and 2 together are ${Math.round(totalSeconds)}s of somebody else's audio,`);
console.log(`  every second of it currently served with a Download MP3 button.`);
console.log(`\n${DIM}  Next: node scripts/fix-rights.mjs --dry${OFF}\n`);
}
