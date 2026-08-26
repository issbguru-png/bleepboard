#!/usr/bin/env node
/**
 * Bleepboard admin CLI — add a sound in one command.
 *
 * Usage:
 *   node scripts/add-sound.mjs \
 *     --title "Vine Boom" \
 *     --slug vine-boom \
 *     --category meme \
 *     --tags "boom,vine,dramatic" \
 *     --audio /path/to/clip.mp3 \
 *     --blurb "60-120 words of unique copy..." \
 *     --origin "One-liner on where the sound comes from"
 *
 * Copies audio into public/audio/{slug}.mp3 (transcoding to mp3 via ffmpeg if needed),
 * measures duration, and writes src/content/sounds/{slug}.json.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i === process.argv.length - 1) {
    if (fallback !== undefined) return fallback;
    console.error(`Missing required --${name}`);
    process.exit(1);
  }
  return process.argv[i + 1];
}

const title = arg('title');
const slug = arg('slug', title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
const category = arg('category');
const tags = arg('tags', '').split(',').map((t) => t.trim()).filter(Boolean);
const audioSrc = arg('audio');
const blurb = arg('blurb');
const origin = arg('origin', '');

// quality gate — mirrors the content schema
const words = blurb.trim().split(/\s+/).length;
if (words < 70) {
  console.error(`Quality gate: blurb is ${words} words — minimum is 70, target 70-110.`);
  console.error(`See docs/writing-blurbs.md. Thin pages are what sinks sites in this niche.`);
  process.exit(1);
}
const catFile = resolve(root, `src/content/categories/${category}.json`);
if (!existsSync(catFile)) {
  console.error(`Unknown category "${category}" — no ${catFile}`);
  process.exit(1);
}

const outAudio = resolve(root, `public/audio/${slug}.mp3`);
mkdirSync(dirname(outAudio), { recursive: true });
// transcode/copy to a normalized mp3 (mono where possible keeps files tiny)
execFileSync('ffmpeg', ['-y', '-i', audioSrc, '-codec:a', 'libmp3lame', '-qscale:a', '5', outAudio], {
  stdio: 'pipe',
});

const duration = parseFloat(
  execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', outAudio,
  ]).toString()
);

const entry = {
  title,
  category,
  tags,
  duration: Math.round(duration * 10) / 10,
  audio: `/audio/${slug}.mp3`,
  blurb: blurb.trim(),
  ...(origin ? { origin } : {}),
  added: new Date().toISOString().slice(0, 10),
  featured: false,
  plays: 0,
};

const outJson = resolve(root, `src/content/sounds/${slug}.json`);
if (existsSync(outJson)) {
  console.error(`Sound "${slug}" already exists at ${outJson}`);
  process.exit(1);
}
writeFileSync(outJson, JSON.stringify(entry, null, 2) + '\n');
console.log(`✓ Added ${title}`);
console.log(`  audio: public/audio/${slug}.mp3 (${entry.duration}s)`);
console.log(`  entry: src/content/sounds/${slug}.json`);
console.log(`  page:  /sound/${slug}/`);
