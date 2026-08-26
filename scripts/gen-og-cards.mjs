#!/usr/bin/env node
/**
 * Per-sound Open Graph cards.
 *
 *   node scripts/gen-og-cards.mjs            # only missing ones
 *   node scripts/gen-og-cards.mjs --force    # regenerate everything
 *   node scripts/gen-og-cards.mjs --only vine-boom,boop
 *
 * Why bother: the site's whole distribution loop is people pasting sound links
 * into Discord and WhatsApp. One generic card for 523 different sounds wastes
 * that — the preview should say which sound it is.
 *
 * Each card is coloured by the sound's category, using the same hues the site
 * uses, so a shared link is visually consistent with the page it opens.
 *
 * Requires rsvg-convert (librsvg). Output lands in public/og/{slug}.png and is
 * committed, because GitHub Pages serves static files only.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'public/og');
const TMP = resolve(root, '.cache/og-tmp.svg');

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const only = (() => {
  const i = argv.indexOf('--only');
  return i === -1 ? null : new Set(argv[i + 1].split(',').map((s) => s.trim()));
})();

/** Light-theme category hues — kept in step with :root in global.css. */
const CAT = {
  meme: '#e0332b', 'sound-effects': '#0e7490', gaming: '#7c3aed', tiktok: '#0891b2',
  notification: '#2563eb', prank: '#ea580c', anime: '#db2777', spongebob: '#b8790a',
  discord: '#5865f2', brainrot: '#65a30d', animal: '#0d9488',
};
const CAT_LABEL = {
  meme: 'Meme', 'sound-effects': 'Sound Effect', gaming: 'Gaming', tiktok: 'TikTok',
  notification: 'Notification', prank: 'Prank', anime: 'Anime', spongebob: 'SpongeBob',
  discord: 'Discord', brainrot: 'Brainrot', animal: 'Animal',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Greedy wrap by estimated width. Helvetica Bold at ~0.56em average advance is
 * close enough for a title card, and we cap at two lines — beyond that the
 * name is competing with the mascot for space.
 */
function wrap(text, fontSize, maxWidth, maxLines = 2) {
  const per = fontSize * 0.56;
  const max = Math.floor(maxWidth / per);
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= max) { cur = next; continue; }
    if (cur) lines.push(cur);
    cur = w;
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    // Ellipsise the last line if we ran out of room.
    const used = lines.join(' ').length;
    if (used < text.length - 1) {
      let last = lines[maxLines - 1];
      while (last.length > 3 && last.length > max - 1) last = last.slice(0, -1);
      lines[maxLines - 1] = last.replace(/[\s,;:.-]+$/, '') + '…';
    }
  }
  return lines;
}

function card({ title, category, duration }) {
  const hue = CAT[category] ?? '#d92d20';
  const label = (CAT_LABEL[category] ?? category).toUpperCase();
  const size = title.length > 26 ? 66 : title.length > 16 ? 80 : 92;
  const lines = wrap(title, size, 640);
  const startY = lines.length > 1 ? 300 : 336;
  const dur = `${Number(duration).toFixed(1).replace(/\.0$/, '')}s`;

  // Deliberately flat: a radial gradient looks nicer but produces thousands of
  // unique colours, which triples the PNG. 92KB -> 35KB by dropping it, and at
  // 523 cards that is the difference between 48MB and 18MB in the repo.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#faf8f5"/>
  <rect x="0" y="0" width="14" height="630" fill="${hue}"/>

  <!-- play button in the category hue -->
  <g transform="translate(96,232)">
    <circle cx="83" cy="83" r="83" fill="${hue}"/>
    <polygon points="64,46 128,83 64,120" fill="#ffffff"/>
  </g>

  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <circle cx="322" cy="199" r="7" fill="${hue}"/>
    <text x="342" y="207" font-size="23" font-weight="700" letter-spacing="3.2" fill="#726c64">${esc(label)} · ${dur}</text>
    ${lines.map((l, i) => `<text x="320" y="${startY + i * (size + 12)}" font-size="${size}" font-weight="800" letter-spacing="-2" fill="#191713">${esc(l)}</text>`).join('\n    ')}
    <text x="320" y="${startY + lines.length * (size + 12) + 22}" font-size="31" font-weight="500" fill="#5b5650">Play it free on Bleepboard. Download the MP3.</text>
  </g>

  <!-- Woofer, small, bottom right -->
  <g transform="translate(1010,470) scale(0.92)" opacity="0.95">
    <path d="M28 56a36 36 0 0 1 72 0" fill="none" stroke="#5b5650" stroke-width="7" stroke-linecap="round"/>
    <rect x="30" y="40" width="68" height="66" rx="15" fill="${hue}"/>
    <circle cx="50" cy="62" r="9" fill="#fff"/><circle cx="50" cy="62" r="3.4" fill="#191713" opacity="0.55"/>
    <circle cx="78" cy="62" r="9" fill="#fff"/><circle cx="78" cy="62" r="3.4" fill="#191713" opacity="0.55"/>
    <circle cx="64" cy="88" r="13" fill="#fff"/><circle cx="64" cy="88" r="4" fill="#191713" opacity="0.55"/>
    <rect x="16" y="50" width="16" height="26" rx="7" fill="#5b5650"/>
    <rect x="96" y="50" width="16" height="26" rx="7" fill="#5b5650"/>
  </g>
  <text x="1010" y="590" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="25" font-weight="800" letter-spacing="-0.6" fill="#191713">Bleepboard</text>
</svg>`;
}

// ---------------------------------------------------------------- run
mkdirSync(OUT, { recursive: true });
mkdirSync(dirname(TMP), { recursive: true });

const dir = resolve(root, 'src/content/sounds');
let files = readdirSync(dir).filter((f) => f.endsWith('.json'));
if (only) files = files.filter((f) => only.has(basename(f, '.json')));

let made = 0, skipped = 0, bytes = 0;
for (const f of files) {
  const slug = basename(f, '.json');
  const out = resolve(OUT, `${slug}.png`);
  if (!FORCE && existsSync(out)) { skipped++; bytes += statSync(out).size; continue; }
  const d = JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
  writeFileSync(TMP, card({ title: d.title, category: d.category, duration: d.duration }));
  execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', TMP, '-o', out]);
  bytes += statSync(out).size;
  made++;
  if (made % 100 === 0) console.log(`  ${made} generated…`);
}
if (existsSync(TMP)) unlinkSync(TMP);

console.log(`\n✓ ${made} generated, ${skipped} already present`);
console.log(`  total ${(bytes / 1024 / 1024).toFixed(1)} MB across ${made + skipped} cards`);
console.log(`  output: public/og/{slug}.png`);
