#!/usr/bin/env node
/**
 * Copy audit: the guard rail behind docs/writing-blurbs.md.
 *
 *   node scripts/audit-copy.mjs            # audit sound blurbs
 *   node scripts/audit-copy.mjs --all      # also audit blog + category copy
 *   node scripts/audit-copy.mjs --slugs a,b,c   # only these (use after an import)
 *
 * Exits non-zero on any HARD failure, so it can gate CI or a pre-commit hook.
 * Soft targets print as warnings. They describe the corpus, not each blurb.
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

/** The Spanish equivalents. Separate list because the English patterns above
 *  are phrase-specific and would never fire on Spanish copy, which would have
 *  left the /es/ half of the corpus effectively unaudited for voice. */
const BANNED_ES = [
  [/\b(sumérgete|sumergirse) en\b/i, '"sumérgete en" (stock AI phrase)'],
  [/\ben el (mundo|ámbito|universo) de\b/i, '"en el mundo/ámbito de" (stock AI phrase)'],
  [/\bno (es|se trata de) solo .{0,40}(es|sino)\b/i, '"no es solo X, es Y"'],
  [/\b(sin duda alguna|cabe destacar|cabe mencionar|en definitiva)\b/i, 'stock AI connector'],
  [/\b(robusto|robusta|sin fisuras|testimonio de)\b/i, 'stock AI vocabulary'],
  [/\bya sea que (seas|eres)\b/i, '"whether you are X or Y" opening'],
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
  if (b.length < 200) note(hard, s.slug, `${b.length} chars, schema requires 200+`);

  for (const [re, label] of BANNED) {
    if (re.test(b)) note(hard, s.slug, `banned: ${label}`);
  }

  // Em dashes are banned outright (owner rule, 2026-08-31). This used to allow
  // one per blurb and warn when the corpus had too FEW, on the theory that zero
  // em dashes is itself an AI tell. That theory is overruled: the house voice
  // now varies rhythm with commas, colons, parentheses and short sentences
  // instead, which is harder and reads better anyway.
  // Checks title and origin too, not just the blurb: all three are rendered on
  // the sound page, and origin doubles as the meta description source.
  const dashes = [b, s.title || '', s.origin || '']
    .join(' ')
    .split('—').length - 1;
  if (dashes > 0) note(hard, s.slug, `${dashes} em-dash${dashes > 1 ? 'es' : ''} (none allowed)`);

  // `Name — appositive` opening: the shape 74 blurbs once shared
  if (/^[^.!?—]{1,45}—/.test(b)) note(hard, s.slug, 'opens `Name — appositive`');

  // rhythm: a blurb where nothing is short reads as machine-even
  const sentences = b.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 2 && !sentences.some((x) => x.split(/\s+/).length < 12)) {
    note(soft, s.slug, 'no sentence under 12 words, vary the rhythm');
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

// ------------------------------------------------- Spanish clip copy
// A sound carrying an `es` block renders a full /es/sound/{slug}/ page, so that
// copy is as user-facing as the English blurb and gets the same hard rules:
// length, em dashes, no duplicates, no shared four-word opening. Checked in its
// own namespace, since a Spanish blurb opening the same way as an unrelated
// English one is not a collision anyone can see.
const esSounds = sounds.filter((s) => s.es);
const esSeen = new Map();
const esOpenings = new Map();
for (const s of esSounds) {
  const b = (s.es.blurb || '').trim();
  const words = b.split(/\s+/).filter(Boolean).length;
  const tag = `${s.slug} (es)`;

  if (words < 70) note(hard, tag, `${words} words (min 70)`);
  else if (words > 110) note(soft, tag, `${words} words (target ≤110)`);
  if (b.length < 200) note(hard, tag, `${b.length} chars, schema requires 200+`);

  for (const [re, label] of BANNED_ES) {
    if (re.test(b)) note(hard, tag, `banned: ${label}`);
  }

  const dashes = [b, s.es.title || '', s.es.origin || ''].join(' ').split('—').length - 1;
  if (dashes > 0) note(hard, tag, `${dashes} em-dash${dashes > 1 ? 'es' : ''} (none allowed)`);

  if (!s.es.title) note(hard, tag, 'es block has no title');

  const sentences = b.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 2 && !sentences.some((x) => x.split(/\s+/).length < 12)) {
    note(soft, tag, 'no sentence under 12 words, vary the rhythm');
  }

  if (esSeen.has(b)) note(hard, tag, `duplicate blurb (matches ${esSeen.get(b)})`);
  else esSeen.set(b, tag);

  const key = b.split(/\s+/).slice(0, 4).join(' ').toLowerCase();
  if (esOpenings.has(key)) note(hard, tag, `shares a 4-word opening with ${esOpenings.get(key)}`);
  else esOpenings.set(key, tag);
}

// A Spanish hub whose own clips are only partly translated is the failure mode
// that silently makes hub copy wrong: the prose says the pages are in one
// language while the grid links to both. Soft, because a board mid-translation
// is a legitimate state to be in for a day, not a reason to fail the build.
if (!only) {
  const byCat = new Map();
  for (const s of sounds) {
    if (!byCat.has(s.category)) byCat.set(s.category, { total: 0, es: 0 });
    const c = byCat.get(s.category);
    c.total++;
    if (s.es) c.es++;
  }
  for (const [cat, c] of byCat) {
    if (c.es > 0 && c.es < c.total) {
      note(soft, `categories/${cat}`, `${c.es} of ${c.total} clips translated, board is mid-translation`);
    }
  }

  // Themes matter more here than categories do. A theme gathers sounds by
  // substring across every category, so translating one category leaves a
  // scattering of themes half done without anybody touching them, and their
  // Spanish copy goes stale silently. Mirrors themeSounds() in src/lib/themes.
  const themeDir = resolve(root, 'src/content/themes');
  if (existsSync(themeDir)) {
    for (const f of readdirSync(themeDir).filter((x) => x.endsWith('.json'))) {
      const t = JSON.parse(readFileSync(resolve(themeDir, f), 'utf8'));
      if (!t.es) continue;
      const pats = (t.match || []).map((m) => m.toLowerCase()).filter(Boolean);
      const hit = sounds.filter((s) => {
        const hay = [s.slug, s.title, ...(s.tags || [])].join(' ').toLowerCase();
        return pats.some((p) => hay.includes(p));
      });
      const es = hit.filter((s) => s.es).length;
      if (es > 0 && es < hit.length) {
        note(soft, `themes/${basename(f, '.json')}`, `${es} of ${hit.length} clips translated, board is mid-translation`);
      }
    }
  }
}

const totalWords = blurbs.reduce((n, b) => n + b.split(/\s+/).length, 0);
const esWords = esSounds.reduce((n, s) => n + (s.es.blurb || '').split(/\s+/).length, 0);
const totalDashes = [
  ...blurbs,
  ...esSounds.map((s) => s.es.blurb || ''),
].reduce((n, b) => n + (b.match(/—/g) || []).length, 0);

// ---------------------------------------------------------------- optional: prose
if (ALL) {
  const check = (label, text, file) => {
    for (const [re, name] of BANNED) if (re.test(text)) note(hard, file, `banned: ${name}`);
    const d = (text.match(/—/g) || []).length;
    if (d > 0) note(hard, file, `${d} em-dash${d > 1 ? 'es' : ''} (none allowed)`);
  };
  const blogDir = resolve(root, 'src/content/blog');
  if (existsSync(blogDir)) {
    for (const f of readdirSync(blogDir).filter((x) => x.endsWith('.md'))) {
      check('blog', readFileSync(resolve(blogDir, f), 'utf8'), `blog/${f}`);
    }
  }
  // Categories and themes are the same shape and carry the same kind of prose,
  // so they get the same treatment. Themes were missed when the collection was
  // added, and a banned construction shipped in fnaf.json before anyone
  // noticed, hence checking both from one list rather than two code paths.
  const introOpenings = new Map();
  for (const dir of ['src/content/categories', 'src/content/themes']) {
    const d0 = resolve(root, dir);
    if (!existsSync(d0)) continue;
    for (const f of readdirSync(d0).filter((x) => x.endsWith('.json'))) {
      const d = JSON.parse(readFileSync(resolve(d0, f), 'utf8'));
      const label = dir.endsWith('themes') ? 'themes' : 'categories';
      // Every user-facing string, both languages. This used to read only
      // `intro` and the FAQ *answers* of the English block, which left FAQ
      // questions, both metaDescriptions and the entire Spanish half of 22
      // bilingual hubs unchecked. An em dash sat in one Spanish
      // metaDescription for a fortnight because nothing looked at it.
      const strings = (blk) =>
        blk ? [blk.metaDescription, blk.intro, ...(blk.faq || []).flatMap((q) => [q.q, q.a])] : [];
      check(label, strings(d).filter(Boolean).join(' '), `${label}/${f}`);
      if (d.es) check(label, strings(d.es).filter(Boolean).join(' '), `${label}/${f} (es)`);

      // Hub intros carry the same four-word-opening rule as blurbs, and for
      // the same reason: hubs render in a grid on /categories/ and a shared
      // opening is invisible per page and obvious across the set. Checked per
      // language, since a Spanish paragraph opening like an unrelated English
      // one is not a collision anyone can see.
      for (const [lang, blk] of [['en', d], ['es', d.es]]) {
        if (!blk?.intro) continue;
        blk.intro
          .split('\n\n')
          .map((p) => p.trim())
          .filter(Boolean)
          .forEach((para, i) => {
            const key = para
              .toLowerCase()
              .replace(/[^\p{L}\p{N}]+/gu, ' ')
              .trim()
              .split(' ')
              .slice(0, 4)
              .join(' ');
            if (!key) return;
            const where = `${label}/${basename(f, '.json')} [${lang}] para ${i + 1}`;
            if (introOpenings.has(key)) {
              note(hard, where, `shares a 4-word opening with ${introOpenings.get(key)}`);
            } else {
              introOpenings.set(key, where);
            }
          });
      }
    }
  }
}

// ---------------------------------------------------------------- report
console.log(`\n${DIM}audited ${sounds.length} sounds${ALL ? ' + blog/category/theme copy' : ''}${OFF}`);
console.log(`  words        ${totalWords.toLocaleString()} total`);
console.log(
  `  es clips     ${esSounds.length} of ${sounds.length} translated, ${esWords.toLocaleString()} words`
);
console.log(`  em-dashes    ${totalDashes} (must be 0)`);

const group = (arr) => {
  const m = new Map();
  for (const { slug, msg } of arr) {
    if (!m.has(msg)) m.set(msg, []);
    m.get(msg).push(slug);
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
};

if (soft.length) {
  console.log(`\n${YEL}soft (${soft.length}), judgement calls not blockers${OFF}`);
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
