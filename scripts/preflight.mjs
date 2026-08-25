#!/usr/bin/env node
/**
 * Stage 1 + 2 of the import pipeline: validate and cache audio BEFORE writing copy.
 *
 *   node scripts/preflight.mjs data/candidates-6.txt
 *
 * Input: newline-separated source slugs (one per line, # comments allowed).
 *
 * What it does, with a bounded parallel pool:
 *   1. HEAD-checks each slug on the media CDN  → knows instantly what's fetchable
 *   2. Downloads the OK ones into .cache/audio/ → copy-writing never blocks on network
 *   3. Writes data/preflight-report.json with status + byte size for every slug
 *
 * Why this shape: the CDN is a public object store that happily serves parallel
 * requests (verified: 12 concurrent → 12x 200). The failure mode is NOT rate
 * limiting, it's per-object AccessDenied for slugs whose CDN filename differs
 * from the page slug. So the win is *validating first* — we never spend effort
 * writing copy for a sound we can't actually fetch.
 *
 * Re-runs are free: anything already in .cache/audio/ is skipped.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(root, '.cache/audio');
const CDN = 'https://media.soundboardguys.com/sound-files/';
const CONCURRENCY = 8;          // verified safe; the CDN served 12 concurrent fine
const RETRIES = 3;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Referer': 'https://soundboardguys.com/',
  'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,*/*;q=0.5',
};

const listFile = process.argv[2];
if (!listFile) {
  console.error('Usage: node scripts/preflight.mjs <slug-list.txt>');
  process.exit(1);
}
const slugs = readFileSync(resolve(root, listFile), 'utf8')
  .split('\n').map((l) => l.split('#')[0].trim()).filter(Boolean);

mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithBackoff(url, opts, label) {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await fetch(url, opts);
      // 403 here means the object isn't public — a permanent condition, don't retry
      if (res.status === 403 || res.status === 404) return res;
      if (res.status === 429 || res.status >= 500) {
        // transient: exponential backoff with jitter so we never hammer
        const wait = 500 * 2 ** attempt + Math.random() * 400;
        console.error(`  ~ ${label}: ${res.status}, backing off ${Math.round(wait)}ms`);
        await sleep(wait);
        continue;
      }
      return res;
    } catch (e) {
      if (attempt === RETRIES - 1) throw e;
      await sleep(500 * 2 ** attempt + Math.random() * 400);
    }
  }
  throw new Error('retries exhausted');
}

async function handle(slug) {
  const dest = resolve(CACHE, `${slug}.mp3`);
  if (existsSync(dest) && statSync(dest).size > 1000) {
    return { slug, status: 'cached', bytes: statSync(dest).size };
  }
  const url = CDN + encodeURIComponent(slug) + '.mp3';
  const head = await fetchWithBackoff(url, { method: 'HEAD', headers: HEADERS }, slug);
  if (!head.ok) return { slug, status: `unavailable-${head.status}` };

  const res = await fetchWithBackoff(url, { headers: HEADERS }, slug);
  if (!res.ok) return { slug, status: `get-failed-${res.status}` };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) return { slug, status: 'too-small' };
  writeFileSync(dest, buf);
  return { slug, status: 'ok', bytes: buf.length };
}

// bounded parallel pool
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < slugs.length) {
    const slug = slugs[cursor++];
    try {
      results.push(await handle(slug));
    } catch (e) {
      results.push({ slug, status: `error: ${e.message}` });
    }
  }
}
const t0 = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const secs = ((Date.now() - t0) / 1000).toFixed(1);

const ok = results.filter((r) => r.status === 'ok' || r.status === 'cached');
const bad = results.filter((r) => !ok.includes(r));
writeFileSync(resolve(root, 'data/preflight-report.json'), JSON.stringify(results, null, 1));

console.log(`\nPreflight done in ${secs}s — ${ok.length} available, ${bad.length} unavailable`);
if (bad.length) {
  console.log('\nUnavailable (do not write copy for these):');
  for (const b of bad) console.log(`  ✗ ${b.slug} — ${b.status}`);
}
console.log(`\nAvailable slugs cached in .cache/audio/. Report: data/preflight-report.json`);
