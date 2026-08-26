#!/usr/bin/env node
/**
 * Copy audit — the guard rail behind docs/writing-blurbs.md.
 *
 *   node scripts/audit-copy.mjs            # audit sound blurbs
 *   node scripts/audit-copy.mjs --all      # also audit blog + category copy
 *   node scripts/audit-copy.mjs --slugs a,b,c   # only these (use after an import)
 *
 * Exits non-zero on any HARD failure, so it can gate CI or a pre-commit hook.
 * Soft targets print as warnings — they describe the corpus, not each blurb.
 *
 * Why this exists: in Aug 2026 all 523 blurbs had to be rewritten because they
 * read as machine-written (517 em-dashes, 74 identical `Name — appositive`
 * openings, 74 "which is exactly why"). This catches that drift as it happens
 * rather than after another 500 sounds land.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const ALL = argv.includes('--all');
const only = (() => {
  const i = argv.indexOf('--slugs');
  return i === -1 ? null : new Set(argv[i + 1].split(',').map((s) => s.trim()));
})();

const RED = '\x1b[31m', YEL = '\x1b[33m', GRN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';

// ---------------------------------------------------------------- load
const soundsDir = resolve(root, 'src/content/sounds');
let sounds = readdirSync(soundsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ slug: basename(f, '.json'), ...JSON.parse(readFileSync(resolve(soundsDir, f), 'utf8')) }));
if (only) sounds = sounds.filter((s) => only.has(s.slug));

// ---------------------------------------------------------------- patterns
/** Banned outright — see docs/writing-blurbs.md */
const BANNED = [
  [/which is (exactly|precisely) (why|what|the)/i, 'which is exactly/precisely …'],
  [/\b(That's|Thats) the (joke|point|entire point|bit|whole point)\.\s*$/im, 'bolted-on emphasis fragment'],
  [/\bThat's the (joke|point|bit)\./i, 'bolted-on emphasis fragment'],
  [/\bEvery single time\./i, 'bolted-on emphasis fragment'],
  [/(isn't|is not|it's not) (just|merely) .{0,40}(it's|but it's)/i, "it's not just X, it's Y"],
  [/\bWhether you're\b/i, "'whether you're X or Y'"],
  [/\b(arguably|quite possibly) the\b/i, 'over-hedged superlative'],
  [/\b(delve|elevate|seamless|robust|leverage|testament|tapestry|boasts)\b/i, 'stock AI vocabulary'],
  [/\b(at its core|in the realm of|look no further)\b/i, 'stock AI phrase'],
];

const hard = [];
const soft = [];
const note = (bucket, slug, msg) => bucket.push({ slug, msg });

// ---------------------------------------------------------------- per-blurb
for (const s of sounds) {
  const b = (s.blurb || '').trim();
  const words = b.split(/\s+/).filter(Boolean).length;

  if (words < 70) note(hard, s.slug, `${words} words (min 70)`);
  else if (words > 110) note(soft, s.slug, `${words} words (target ≤110)`);
  if (b.length < 200) note(hard, s.slug, `${b.length} chars — schema requires 200+`);

  for (const [re, label] of BANNED) {
    if (re.test(b)) note(hard, s.slug, `banned: ${label}`);
  }

  const dashes = (b.match(/—/g) || []).length;
  if (dashes >= 2) note(hard, s.slug, `${dashes} em-dashes in one blurb (max 1)`);

  // `Name — appositive` opening: the shape 74 blurbs once shared
  if (/^[^.!?—]{1,45}—/.test(b)) note(hard, s.slug, 'opens `Name — appositive`');

  // rhythm: a blurb where nothing is short reads as machine-even
  const sentences = b.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 2 && !sentences.some((x) => x.split(/\s+/).length < 12)) {
    note(soft, s.slug, 'no sentence under 12 words — vary the rhythm');
  }
}

// ---------------------------------------------------------------- corpus-wide
const blurbs = sounds.map((s) => s.blurb || '');
const seen = new Map();
for (const s of sounds) {
  const key = (s.blurb || '').trim();
  if (seen.has(key)) note(hard, s.slug, `duplicate blurb (matches ${seen.get(key)})`);
  else seen.set(key, s.slug);
}
const openings = new Map();
for (const s of sounds) {
  const key = (s.blurb || '').split(/\s+/).slice(0, 4).join(' ').toLowerCase();
  if (openings.has(key)) note(hard, s.slug, `shares a 4-word opening with ${openings.get(key)}`);
  else openings.set(key, s.slug);
}

const totalWords = blurbs.reduce((n, b) => n + b.split(/\s+/).length, 0);
const totalDashes = blurbs.reduce((n, b) => n + (b.match(/—/g) || []).length, 0);
const perBlurb = sounds.length ? totalDashes / sounds.length : 0;

// ---------------------------------------------------------------- optional: prose
if (ALL) {
  const check = (label, text, file) => {
    for (const [re, name] of BANNED) if (re.test(text)) note(hard, file, `banned: ${name}`);
    const d = (text.match(/—/g) || []).length;
    const w = text.split(/\s+/).length;
    if (w > 200 && d / w > 1 / 250) note(soft, file, `em-dash density 1 per ${Math.round(w / d)} words (target ≥250)`);
  };
  const blogDir = resolve(root, 'src/content/blog');
  if (existsSync(blogDir)) {
    for (const f of readdirSync(blogDir).filter((x) => x.endsWith('.md'))) {
      check('blog', readFileSync(resolve(blogDir, f), 'utf8'), `blog/${f}`);
    }
  }
  const catDir = resolve(root, 'src/content/categories');
  if (existsSync(catDir)) {
    for (const f of readdirSync(catDir).filter((x) => x.endsWith('.json'))) {
      const d = JSON.parse(readFileSync(resolve(catDir, f), 'utf8'));
      check('cat', [d.intro, ...(d.faq || []).map((q) => q.a)].join(' '), `categories/${f}`);
    }
  }
}

// ---------------------------------------------------------------- report
console.log(`\n${DIM}audited ${sounds.length} sounds${ALL ? ' + blog/category copy' : ''}${OFF}`);
console.log(`  words        ${totalWords.toLocaleString()} total`);
console.log(`  em-dashes    ${totalDashes} (${perBlurb.toFixed(2)}/blurb — target 0.25–0.40)`);

if (perBlurb > 0.45) soft.push({ slug: '(corpus)', msg: `em-dash density ${perBlurb.toFixed(2)}/blurb is drifting up` });
if (sounds.length > 40 && perBlurb < 0.10)
  soft.push({ slug: '(corpus)', msg: `em-dash density ${perBlurb.toFixed(2)}/blurb — zero is its own tell, let some back in` });

const group = (arr) => {
  const m = new Map();
  for (const { slug, msg } of arr) {
    if (!m.has(msg)) m.set(msg, []);
    m.get(msg).push(slug);
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
};

if (soft.length) {
  console.log(`\n${YEL}soft (${soft.length}) — judgement calls, not blockers${OFF}`);
  for (const [msg, slugs] of group(soft)) {
    console.log(`  ${msg} ${DIM}(${slugs.length})${OFF}  ${slugs.slice(0, 6).join(', ')}${slugs.length > 6 ? '…' : ''}`);
  }
}

if (hard.length) {
  console.log(`\n${RED}FAIL (${hard.length})${OFF}`);
  for (const [msg, slugs] of group(hard)) {
    console.log(`  ${msg} ${DIM}(${slugs.length})${OFF}  ${slugs.slice(0, 8).join(', ')}${slugs.length > 8 ? '…' : ''}`);
  }
  console.log(`\n${DIM}Fix by rewriting the sentence, not by find-and-replace.`);
  console.log(`See docs/writing-blurbs.md for worked before/after examples.${OFF}\n`);
  process.exit(1);
}

console.log(`\n${GRN}✓ copy audit clean${OFF}\n`);
