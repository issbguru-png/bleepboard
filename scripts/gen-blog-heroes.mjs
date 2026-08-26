#!/usr/bin/env node
/**
 * Per-article blog artwork.
 *
 *   node scripts/gen-blog-heroes.mjs            # only missing ones
 *   node scripts/gen-blog-heroes.mjs --force    # regenerate everything
 *   node scripts/gen-blog-heroes.mjs --only what-does-67-mean
 *
 * One 1200x630 PNG per article, doing three jobs at once: the hero on the
 * article page, the thumbnail on /blog/, and og:image when the link is pasted
 * into Discord or iMessage. Sized 1200x630 because that is what the social
 * scrapers want; the pages crop it with object-fit for the narrower slots.
 *
 * WHY DRAWN, NOT PHOTOGRAPHED OR SCRAPED
 * These articles are *about* other people's characters and brands — SpongeBob,
 * FNAF, Skibidi Toilet, Minecraft, Jet2, Apple Pay. Writing about them is fair
 * comment. Drawing them on a thumbnail is not, and this site is applying to ad
 * networks. So every motif below is original Bleepboard brand art: geometry,
 * waveform shapes, typography and the Woofer mascot. Nothing here depicts,
 * imitates or evokes a third-party character, logo or trade dress. If you add
 * an article and find yourself reaching for a likeness, reach for an abstract
 * motif instead — that is the whole point of this file.
 *
 * Deliberately flat, no gradients, same finding as scripts/gen-og-cards.mjs: a
 * gradient produces thousands of unique colours and triples the PNG. Every fill
 * here is one of a handful of flat colours, which is why these land at ~10-25KB
 * each instead of ~90KB.
 *
 * Variety is the other design constraint. Thirteen runs of one template make an
 * archive grid look like a spreadsheet, so each article gets its own hue, its
 * own motif family (grid / bars / bands / dots / rings / type / curve) and, for
 * the two horror pieces, an inverted dark canvas.
 *
 * Requires rsvg-convert (librsvg). Output lands in public/blog/{slug}.png and
 * is committed — the host serves static files only.
 */
import { writeFileSync, existsSync, mkdirSync, unlinkSync, statSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'public/blog');
const TMP = resolve(root, '.cache/blog-hero-tmp.svg');

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const only = (() => {
  const i = argv.indexOf('--only');
  return i === -1 ? null : new Set(argv[i + 1].split(',').map((s) => s.trim()));
})();

const W = 1200;
const H = 630;
/** Everything below this belongs to the brand strip. Motifs stay above it. */
const FLOOR = 506;

// --- palette --------------------------------------------------------------
// Same warm paper the site uses. The dark variant is the site's dark theme.
const LIGHT = { bg: '#faf8f5', ink: '#191713', muted: '#726c64', dim: '#5b5650', line: '#e5dfd6' };
const DARK  = { bg: '#131211', ink: '#f2efea', muted: '#948e85', dim: '#b8b3ab', line: '#322e29' };

const chan = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Flat blend of two hex colours. Used to make tints — each call adds exactly
 *  one more flat colour to the PNG, which a gradient would not. */
function mix(a, b, t) {
  const A = chan(a), B = chan(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Math.round(v * 100) / 100;

// --- motifs ---------------------------------------------------------------
// Each takes ({ hue, t }) where `t` is the theme, and returns SVG that fits
// inside 1200 x FLOOR. Kept as plain shapes so the rasteriser stays cheap.

/** Soundboard pads. The literal object the site is: a grid of buttons. */
function padGrid({ hue, t }) {
  const soft = mix(hue, t.bg, 0.86), mid = mix(hue, t.bg, 0.55);
  const x0 = 72, y0 = 78, cw = 192, ch = 109, g = 24;
  // Which pads are lit — an arbitrary but deliberate rhythm, not a pattern.
  const lit = new Set([1, 4, 5, 7, 9, 12, 13]);
  const half = new Set([0, 6, 11, 14]);
  let out = '';
  for (let i = 0; i < 15; i++) {
    const x = x0 + (i % 5) * (cw + g), y = y0 + Math.floor(i / 5) * (ch + g);
    const fill = lit.has(i) ? hue : half.has(i) ? mid : soft;
    out += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="20" fill="${fill}"/>`;
  }
  // one pad reads as "press me"
  const px = x0 + 2 * (cw + g), py = y0 + 1 * (ch + g);
  out += `<polygon points="${px + 82},${py + 32} ${px + 126},${py + 55} ${px + 82},${py + 78}" fill="${t.bg}"/>`;
  return out;
}

/** A shout that runs out of headroom: the loud bars hit the ceiling flat. */
function clippedBars({ hue, t }) {
  const soft = mix(hue, t.bg, 0.62);
  const base = 452, ceil = 96, bw = 34, pitch = 54;
  const count = 19;
  const start = (W - (count * pitch - (pitch - bw))) / 2;
  let out = `<line x1="72" y1="${ceil}" x2="1128" y2="${ceil}" stroke="${mix(hue, t.bg, 0.45)}" stroke-width="3" stroke-dasharray="12 10"/>`;
  for (let i = 0; i < count; i++) {
    const u = (i - (count - 1) / 2) / ((count - 1) / 2);   // -1..1
    const env = Math.pow(1 - Math.abs(u), 1.5) * 1.35;      // peaks past 1 = clipped
    const want = 40 + env * 380;
    const clipped = base - want < ceil;
    const h = clipped ? base - ceil : want;
    out += `<rect x="${n(start + i * pitch)}" y="${n(base - h)}" width="${bw}" height="${n(h)}" rx="${clipped ? 6 : 17}" fill="${clipped ? hue : soft}"/>`;
  }
  return out;
}

/** Datamosh: one block sliced into bands and shoved sideways. */
function glitchBands({ hue, t }) {
  const soft = mix(hue, t.bg, 0.55);
  const x = 262, y = 100, w = 676, bands = 11, bh = 348 / bands;
  // Fixed offsets rather than Math.random(), so a rerun is byte-identical.
  const dx = [0, 96, -54, 22, -128, 64, -18, 118, -86, 34, -40];
  let out = '';
  for (let i = 0; i < bands; i++) {
    const fill = i === 3 ? t.ink : i % 3 === 1 ? soft : hue;
    out += `<rect x="${n(x + dx[i])}" y="${n(y + i * bh)}" width="${w}" height="${n(bh + 1)}" fill="${fill}"/>`;
  }
  return out;
}

/** A field that repeats itself into mush. Brainrot, drawn. */
function dotMatrix({ hue, t }) {
  const soft = mix(hue, t.bg, 0.6);
  let out = '';
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 18; c++) {
      const x = 96 + c * 59.3, y = 118 + r * 52;
      const s = Math.sin(c * 0.62 + r * 0.48);
      const rad = 4.5 + (s + 1) * 6.6;
      out += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rad)}" fill="${s > 0.25 ? hue : soft}"/>`;
    }
  }
  return out;
}

/** Flat, flat, flat — then the spike that makes you drop the mouse. */
function screamSpike({ hue, t }) {
  const guide = mix(hue, t.bg, 0.72);
  const pts = [];
  for (let x = 88; x <= 1112; x += 16) {
    let y = 292 + Math.sin(x * 0.31) * 5;
    if (x > 452 && x < 760) {
      const u = (x - 452) / 308;                       // 0..1 across the burst
      const amp = Math.sin(u * Math.PI) * 205;
      y = 292 + (Math.round(x / 16) % 2 ? -amp : amp) * (0.55 + u * 0.65);
    }
    pts.push(`${n(x)},${n(Math.max(84, Math.min(482, y)))}`);
  }
  return `<line x1="88" y1="120" x2="1112" y2="120" stroke="${guide}" stroke-width="3"/>
    <line x1="88" y1="464" x2="1112" y2="464" stroke="${guide}" stroke-width="3"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${hue}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/** A calm voice, then one thing that should not be there. */
function flatline({ hue, t }) {
  const soft = mix(hue, t.bg, 0.66);
  let ticks = '';
  for (let x = 96; x <= 1104; x += 84) ticks += `<line x1="${x}" y1="288" x2="${x}" y2="312" stroke="${mix(hue, t.bg, 0.82)}" stroke-width="3"/>`;
  const pts = [];
  for (let x = 96; x <= 1104; x += 8) {
    let y = 300;
    if (x >= 560) {
      const u = (x - 560) / 300;
      y = 300 - Math.sin(u * Math.PI * 3.6) * 132 * Math.exp(-u * 2.6);
    }
    pts.push(`${n(x)},${n(y)}`);
  }
  return `${ticks}
    <line x1="96" y1="300" x2="1104" y2="300" stroke="${soft}" stroke-width="5"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${hue}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/** Upload: a clip lifted into a tray. Generic on purpose — no app's chrome. */
function uploadTray({ hue, t }) {
  const soft = mix(hue, t.bg, 0.72);
  let bars = '';
  for (let i = 0; i < 7; i++) {
    const h = [22, 38, 30, 46, 26, 40, 20][i];
    bars += `<rect x="${520 + i * 24}" y="${n(146 - h / 2)}" width="10" height="${h}" rx="5" fill="${hue}"/>`;
  }
  return `<rect x="486" y="104" width="228" height="84" rx="42" fill="${soft}"/>
    ${bars}
    <path d="M430 288 L430 412 L770 412 L770 288" fill="none" stroke="${hue}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="600" y1="376" x2="600" y2="256" stroke="${hue}" stroke-width="16" stroke-linecap="round"/>
    <polygon points="600,218 654,276 546,276" fill="${hue}"/>`;
}

/** A chime crossing a room: one-sided wavefronts that flatten as they travel.
 *  The half-angle is solved per ring so every arc reaches the same height —
 *  which is what lets the far ones stretch to the right edge without spilling
 *  into the brand strip. */
function ripple({ hue, t }) {
  const cx = 150, cy = 286, REACH = 190;
  let out = `<circle cx="${cx}" cy="${cy}" r="34" fill="${hue}"/>`;
  const radii = [120, 260, 420, 620, 860];
  radii.forEach((r, i) => {
    const a = Math.min((52 * Math.PI) / 180, Math.asin(Math.min(1, REACH / r)));
    const x1 = n(cx + r * Math.cos(-a)), y1 = n(cy + r * Math.sin(-a));
    const x2 = n(cx + r * Math.cos(a)), y2 = n(cy + r * Math.sin(a));
    out += `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}" fill="none" stroke="${mix(hue, t.bg, i * 0.16)}" stroke-width="${20 - i * 3}" stroke-linecap="round"/>`;
  });
  return out;
}

/** Sun over a flat sea. Holiday, in the abstract — no airline anywhere. */
function sunHorizon({ hue, t }) {
  const soft = mix(hue, t.bg, 0.58);
  const cx = 600, cy = 262, r = 172;
  // Each slice is cut to the chord at its *widest* edge and then given a couple
  // of pixels of slack. It is painted in the page's own background colour, so
  // the overhang is invisible while an undershoot would leave slivers of sun
  // stranded at the corners of every band.
  let slices = '';
  [[276, 12], [306, 16], [342, 21], [386, 26]].forEach(([y, h]) => {
    const dy = Math.abs(y - cy);
    const hw = Math.sqrt(Math.max(0, r * r - dy * dy)) + 2;
    slices += `<rect x="${n(cx - hw)}" y="${y}" width="${n(hw * 2)}" height="${h}" fill="${t.bg}"/>`;
  });
  let sea = '';
  [[452, 520], [472, 372], [488, 232]].forEach(([y, w]) => {
    sea += `<rect x="${n(cx - w / 2)}" y="${y}" width="${w}" height="8" rx="4" fill="${soft}"/>`;
  });
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${hue}"/>${slices}${sea}`;
}

/** A heavy length of steel, mid-fall, about to ruin somebody's take. */
function fallingPipe({ hue, t }) {
  const shade = mix(hue, t.ink, 0.32), shine = mix(hue, t.bg, 0.42);
  // The fan sits at the pipe's low end and opens away from it — swept round to
  // the free side so no tick reads as skewering the bar.
  let ticks = '';
  [-6, 22, 50, 78, 106].forEach((deg, i) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const r0 = 42, r1 = 42 + [58, 78, 88, 78, 58][i];
    ticks += `<line x1="${n(856 + r0 * Math.cos(a))}" y1="${n(402 + r0 * Math.sin(a))}" x2="${n(856 + r1 * Math.cos(a))}" y2="${n(402 + r1 * Math.sin(a))}" stroke="${hue}" stroke-width="11" stroke-linecap="round"/>`;
  });
  return `${ticks}
    <g transform="rotate(27 600 246)">
      <rect x="318" y="212" width="564" height="92" rx="46" fill="${hue}"/>
      <rect x="352" y="232" width="496" height="16" rx="8" fill="${shine}"/>
      <rect x="352" y="276" width="496" height="10" rx="5" fill="${shade}"/>
    </g>`;
}

/** Sub-bass hitting the room. Squashed rings rather than circles, so it reads
 *  as pressure spreading sideways and not as a bullseye. */
function boomRings({ hue, t }) {
  const cx = 600, cy = 268;
  let out = '';
  [[318, 196, 9], [232, 143, 15], [148, 91, 23]].forEach(([rx, ry, w], i) => {
    out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${mix(hue, t.bg, 0.5 - i * 0.2)}" stroke-width="${w}"/>`;
  });
  out += `<ellipse cx="${cx}" cy="${cy}" rx="80" ry="50" fill="${hue}"/>`;
  return out;
}

/** A straight line that cannot keep it together. */
function wobble({ hue, t }) {
  const pts = [];
  for (let x = 96; x <= 1104; x += 8) {
    const u = (x - 96) / 1008;
    pts.push(`${n(x)},${n(288 + Math.sin(x / 74) * (16 + u * 132))}`);
  }
  let dots = '';
  [300, 660, 1010].forEach((x) => {
    const u = (x - 96) / 1008;
    dots += `<circle cx="${x}" cy="${n(288 + Math.sin(x / 74) * (16 + u * 132))}" r="15" fill="${t.bg}" stroke="${hue}" stroke-width="8"/>`;
  });
  return `<line x1="96" y1="288" x2="1104" y2="288" stroke="${mix(hue, t.bg, 0.76)}" stroke-width="4" stroke-dasharray="14 12"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${hue}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
}

/** The joke is the number, so the number is the picture. */
function bigNumerals({ hue, t }) {
  return `<rect x="286" y="88" width="628" height="368" rx="52" fill="${mix(hue, t.bg, 0.86)}"/>
    <text x="600" y="392" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-size="326" font-weight="800" letter-spacing="-18" fill="${hue}">67</text>`;
}

// --- the roster -----------------------------------------------------------
// hue: chosen from the site's own category palette where the topic maps onto a
// category, and spread around the wheel otherwise so no two neighbours in the
// archive grid read as the same card.
const POSTS = {
  'what-is-a-soundboard':                { hue: '#d92d20', motif: padGrid,      label: 'GUIDE · SOUNDBOARDS',
    alt: 'Abstract Bleepboard artwork: a grid of rounded sound pads, several lit in red, one showing a play triangle' },
  'get-out-meme-explained':              { hue: '#e11d48', motif: clippedBars,  label: 'MEME ORIGINS · TIKTOK',
    alt: 'Abstract Bleepboard artwork: a row of audio bars peaking so hard the loudest ones flatten against a ceiling line' },
  'skibidi-toilet-explained':            { hue: '#db2777', motif: glitchBands,  label: 'BRAINROT · GEN ALPHA',
    alt: 'Abstract Bleepboard artwork: a magenta block sliced into horizontal bands and shoved sideways, like a glitched video frame' },
  'italian-brainrot-explained':          { hue: '#65a30d', motif: dotMatrix,    label: 'BRAINROT · EXPLAINER',
    alt: 'Abstract Bleepboard artwork: a repeating field of green dots swelling and shrinking in waves' },
  'fnaf-jumpscare-sounds-explained':     { hue: '#a78bfa', motif: screamSpike,  label: 'GAMING · HORROR SOUND', dark: true,
    alt: 'Abstract Bleepboard artwork: a flat violet waveform on black that erupts into one violent spike' },
  'what-is-verity-minecraft':            { hue: '#8b95ff', motif: flatline,     label: 'GAMING · HORROR SERIES', dark: true,
    alt: 'Abstract Bleepboard artwork: a calm flat line on black interrupted by a single decaying blip' },
  'how-to-add-sounds-to-discord-soundboard': { hue: '#5865f2', motif: uploadTray, label: 'HOW-TO · DISCORD', panel: true,
    alt: 'Abstract Bleepboard artwork: an arrow lifting a small waveform clip up out of a tray, drawn as a plain upload symbol' },
  'apple-pay-sound-meme':                { hue: '#2563eb', motif: ripple,       label: 'MEME ORIGINS · NOTIFICATION',
    alt: 'Abstract Bleepboard artwork: a blue dot sending four widening arcs across the frame, like a chime crossing a room' },
  'nothing-beats-a-jet2-holiday-meme':   { hue: '#0891b2', motif: sunHorizon,   label: 'TIKTOK · HOLIDAY MEME',
    alt: 'Abstract Bleepboard artwork: a cyan sun sliced by horizontal bands sitting above three lines of flat sea' },
  'metal-pipe-falling-sound-meme':       { hue: '#475569', motif: fallingPipe,  label: 'MEME ORIGINS · SOUND EFFECT',
    alt: 'Abstract Bleepboard artwork: a long steel-grey bar falling on a diagonal, with impact marks radiating from where it lands' },
  'vine-boom-sound-history':             { hue: '#ea580c', motif: boomRings,    label: 'SOUND EFFECT · HISTORY',
    alt: 'Abstract Bleepboard artwork: a solid orange disc with three concentric rings expanding away from it' },
  'goofy-ahh-meaning-sounds':            { hue: '#b8790a', motif: wobble,       label: 'MEME ORIGINS · SLANG',
    alt: 'Abstract Bleepboard artwork: a straight line that wobbles into a bigger and bigger squiggle across the frame' },
  'what-does-67-mean':                   { hue: '#0d9488', motif: bigNumerals,  label: 'SLANG · GEN ALPHA',
    alt: 'Abstract Bleepboard artwork: the numerals 67 set very large in teal on a soft tinted panel' },
};

// --- frame ----------------------------------------------------------------
/** Woofer, small, in the brand strip. Same shapes as the mascot component and
 *  the sound cards — this is the one piece of character art the site owns. */
function woofer(hue, t) {
  return `<g transform="translate(884,520) scale(0.55)">
    <path d="M28 56a36 36 0 0 1 72 0" fill="none" stroke="${t.dim}" stroke-width="7" stroke-linecap="round"/>
    <rect x="30" y="40" width="68" height="66" rx="15" fill="${hue}"/>
    <circle cx="50" cy="62" r="9" fill="${t.bg}"/><circle cx="50" cy="62" r="3.4" fill="${t.ink}" opacity="0.55"/>
    <circle cx="78" cy="62" r="9" fill="${t.bg}"/><circle cx="78" cy="62" r="3.4" fill="${t.ink}" opacity="0.55"/>
    <circle cx="64" cy="88" r="13" fill="${t.bg}"/><circle cx="64" cy="88" r="4" fill="${t.ink}" opacity="0.55"/>
    <rect x="16" y="50" width="16" height="26" rx="7" fill="${t.dim}"/>
    <rect x="96" y="50" width="16" height="26" rx="7" fill="${t.dim}"/>
  </g>`;
}

function build(spec) {
  const t = spec.dark ? DARK : LIGHT;
  const { hue, label } = spec;
  const panel = spec.panel
    ? `<rect x="48" y="48" width="1104" height="410" rx="36" fill="${mix(hue, t.bg, 0.93)}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <rect x="0" y="0" width="14" height="${H}" fill="${hue}"/>
  ${panel}
  ${spec.motif({ hue, t })}
  <line x1="72" y1="${FLOOR}" x2="1128" y2="${FLOOR}" stroke="${t.line}" stroke-width="2"/>
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <circle cx="80" cy="562" r="8" fill="${hue}"/>
    <text x="106" y="571" font-size="25" font-weight="700" letter-spacing="3.2" fill="${t.muted}">${esc(label)}</text>
    <text x="1128" y="571" text-anchor="end" font-size="26" font-weight="800" letter-spacing="-0.6" fill="${t.ink}">Bleepboard</text>
  </g>
  ${woofer(hue, t)}
</svg>`;
}

// --- run ------------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
mkdirSync(dirname(TMP), { recursive: true });

// Loud rather than silent: an article with no entry here would otherwise ship
// with no artwork and nobody would notice until the share preview was blank.
const articles = readdirSync(resolve(root, 'src/content/blog'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''));
const missing = articles.filter((s) => !(s in POSTS));
if (missing.length) {
  console.warn(`! no artwork defined for: ${missing.join(', ')}`);
  console.warn('  add a POSTS entry (hue + motif + label + alt) in this file.');
}

let made = 0, skipped = 0, bytes = 0;
const sizes = [];
for (const [slug, spec] of Object.entries(POSTS)) {
  if (only && !only.has(slug)) continue;
  const out = resolve(OUT, `${slug}.png`);
  if (!FORCE && existsSync(out)) { skipped++; bytes += statSync(out).size; continue; }
  writeFileSync(TMP, build(spec));
  execFileSync('rsvg-convert', ['-w', String(W), '-h', String(H), TMP, '-o', out]);
  const size = statSync(out).size;
  bytes += size;
  sizes.push([slug, size]);
  made++;
}
if (existsSync(TMP)) unlinkSync(TMP);

sizes.sort((a, b) => b[1] - a[1]);
for (const [slug, size] of sizes) console.log(`  ${String(Math.round(size / 1024)).padStart(4)} KB  ${slug}.png`);
console.log(`\n✓ ${made} generated, ${skipped} already present`);
console.log(`  total ${(bytes / 1024).toFixed(0)} KB across ${made + skipped} images`);
console.log(`  output: public/blog/{slug}.png`);
