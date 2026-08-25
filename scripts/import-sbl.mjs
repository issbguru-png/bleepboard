#!/usr/bin/env node
/**
 * Batch importer: pulls curated sounds from a manifest, downloads the audio
 * from the source page, transcodes to MP3, and writes content entries.
 *
 * Manifest format (JSON array):
 *   { "url": "<source page>", "slug": "vine-boom", "title": "Vine Boom",
 *     "category": "meme", "tags": ["boom"], "blurb": "...", "origin": "...", "plays": 0 }
 *
 * Usage: node scripts/import-sbl.mjs data/import-batch-1.json
 *
 * Extraction: soundbuttonslab sound pages reference the page's own audio in
 * the first playSound('<id>', '<mp3-path>') call after the <h1>.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('Usage: node scripts/import-sbl.mjs <manifest.json>');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(resolve(root, manifestPath), 'utf8'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, failed = [];

for (const item of manifest) {
  const { url, slug, title, category, tags, blurb, origin = '', plays = 0 } = item;
  const outJson = resolve(root, `src/content/sounds/${slug}.json`);
  if (existsSync(outJson)) {
    console.log(`- ${slug}: already exists, skipping`);
    continue;
  }
  const words = blurb.trim().split(/\s+/).length;
  if (words < 40) {
    console.error(`✗ ${slug}: blurb is ${words} words (<40) — quality gate. Skipped.`);
    failed.push(slug);
    continue;
  }
  try {
    const html = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
    const m = html.match(/playSound\('[^']*',\s*'([^']+)'\)/);
    if (!m) throw new Error('no playSound() audio reference found');
    const audioUrl = new URL(m[1], url).href;
    const raw = Buffer.from(await (await fetch(audioUrl, { headers: { 'User-Agent': UA } })).arrayBuffer());
    if (raw.length < 1000) throw new Error(`audio too small (${raw.length}B)`);
    const tmp = resolve(root, `.import-tmp-${slug}`);
    writeFileSync(tmp, raw);
    const outAudio = resolve(root, `public/audio/${slug}.mp3`);
    mkdirSync(dirname(outAudio), { recursive: true });
    execFileSync('ffmpeg', ['-y', '-i', tmp, '-codec:a', 'libmp3lame', '-qscale:a', '5', outAudio], { stdio: 'pipe' });
    unlinkSync(tmp);
    const duration = parseFloat(
      execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', outAudio]).toString()
    );
    const entry = {
      title, category, tags,
      duration: Math.round(duration * 10) / 10,
      audio: `/audio/${slug}.mp3`,
      blurb: blurb.trim(),
      ...(origin ? { origin } : {}),
      added: new Date().toISOString().slice(0, 10),
      featured: false,
      plays,
    };
    writeFileSync(outJson, JSON.stringify(entry, null, 2) + '\n');
    ok++;
    console.log(`✓ ${slug} (${entry.duration}s)`);
  } catch (e) {
    failed.push(slug);
    console.error(`✗ ${slug}: ${e.message}`);
  }
  await sleep(400); // politeness
}
console.log(`\nDone: ${ok} imported, ${failed.length} failed${failed.length ? ': ' + failed.join(', ') : ''}`);
