#!/usr/bin/env node
/**
 * Acts on the tiering from audit-rights.mjs.
 *
 *   node scripts/fix-rights.mjs --dry     # what it would do, changes nothing
 *   node scripts/fix-rights.mjs --apply
 *
 * Two different problems, two different fixes.
 *
 * TIER 1, commercial music recordings, are removed. The clip, the MP3 and the
 * copy all go, and the URL gets a redirect to the board it was on so an
 * existing link does not land on a 404. These are the ones Google's policy
 * names, and there is no version of hosting the Star Wars theme as a free
 * download that is fine.
 *
 * TIER 2, studio-owned audio that is not a record, keeps its page and its play
 * button and loses the download. The policy language is about *downloading*
 * copyrighted content, and handing somebody an MP3 is a different act from
 * letting them press play on seven seconds of a console startup chime. This
 * keeps the page, the blurb and whatever it ranks for.
 *
 * The removal list is written to src/data/removed-sounds.json, which
 * astro.config.mjs turns into redirects. That file is the record of what left
 * and why, so a question in six months has an answer.
 */
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RED = '\x1b[31m', YEL = '\x1b[33m', GRN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
if (!apply && !argv.includes('--dry')) {
  console.error('Pass --dry or --apply.');
  process.exit(1);
}

const tiers = JSON.parse(
  execFileSync('node', [resolve(root, 'scripts/audit-rights.mjs'), '--json'], { cwd: root, encoding: 'utf8' })
);
const t1 = tiers.filter((s) => s.tier === 1);
const t2 = tiers.filter((s) => s.tier === 2);

const soundFile = (id) => resolve(root, `src/content/sounds/${id}.json`);
const audioFile = (id) => resolve(root, `public/audio/${id}.mp3`);
const ogFile = (id) => resolve(root, `public/og/${id}.png`);

// Where a removed clip's URL should point. Its own category board is the
// closest thing to what the visitor was after.
const removals = t1.map((s) => {
  const data = JSON.parse(readFileSync(soundFile(s.id), 'utf8'));
  return {
    slug: s.id,
    title: data.title,
    category: data.category,
    removedOn: new Date().toISOString().slice(0, 10),
    reason: s.why,
    origin: data.origin ?? '',
    redirectTo: `/${data.category}-soundboard/`,
  };
});

console.log(`\n${RED}REMOVE${OFF}  ${removals.length} commercial music recordings`);
for (const r of removals) {
  console.log(`  ${r.slug.padEnd(30)} ${DIM}→ ${r.redirectTo}${OFF}`);
}

console.log(`\n${YEL}NO DOWNLOAD${OFF}  ${t2.length} studio-owned clips keep their page, lose the MP3 button`);
for (const s of t2) console.log(`  ${s.id.padEnd(30)} ${DIM}${s.why}${OFF}`);

if (!apply) {
  console.log(`\n${DIM}Dry run. Nothing changed. Re-run with --apply.${OFF}\n`);
} else {
  // Tier 2 first: a flag flip, and harmless if the run is interrupted.
  let flipped = 0;
  for (const s of t2) {
    const f = soundFile(s.id);
    const d = JSON.parse(readFileSync(f, 'utf8'));
    if (d.downloadable === false) continue;
    d.downloadable = false;
    writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
    flipped++;
  }

  const dataDir = resolve(root, 'src/data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const listFile = resolve(dataDir, 'removed-sounds.json');
  const existing = existsSync(listFile) ? JSON.parse(readFileSync(listFile, 'utf8')) : [];
  const merged = [...existing.filter((e) => !removals.some((r) => r.slug === e.slug)), ...removals]
    .sort((a, b) => a.slug.localeCompare(b.slug));
  writeFileSync(listFile, JSON.stringify(merged, null, 2) + '\n');

  let removed = 0;
  for (const r of removals) {
    for (const f of [soundFile(r.slug), audioFile(r.slug), ogFile(r.slug)]) {
      if (existsSync(f)) rmSync(f);
    }
    removed++;
  }

  console.log(`\n${GRN}Applied.${OFF} ${removed} removed, ${flipped} downloads turned off.`);
  console.log(`${DIM}Redirects come from src/data/removed-sounds.json via astro.config.mjs.`);
  console.log(`Next: npm run audit && npm run build${OFF}\n`);
}
