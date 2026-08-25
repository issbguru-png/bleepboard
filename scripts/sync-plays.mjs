#!/usr/bin/env node
/**
 * Sync play counts from Cloudflare KV back into the content JSONs, so the
 * statically-built "trending" ordering reflects real plays.
 *
 * Requires wrangler authenticated (`npx wrangler login`) and the KV namespace id:
 *   node scripts/sync-plays.mjs --namespace-id <KV_NAMESPACE_ID>
 *
 * Run weekly (cron / GitHub Action), commit the JSON changes, redeploy.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--namespace-id');
if (i === -1) {
  console.error('Usage: node scripts/sync-plays.mjs --namespace-id <KV_NAMESPACE_ID>');
  process.exit(1);
}
const ns = process.argv[i + 1];

const listRaw = execFileSync('npx', ['wrangler', 'kv', 'key', 'list', '--namespace-id', ns], {
  cwd: root,
}).toString();
const keys = JSON.parse(listRaw).map((k) => k.name).filter((n) => n.startsWith('plays:'));

let updated = 0;
for (const key of keys) {
  const slug = key.slice('plays:'.length);
  const file = resolve(root, `src/content/sounds/${slug}.json`);
  let entry;
  try {
    entry = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    continue; // sound was removed
  }
  const count = parseInt(
    execFileSync('npx', ['wrangler', 'kv', 'key', 'get', key, '--namespace-id', ns], { cwd: root })
      .toString()
      .trim(),
    10
  );
  if (Number.isFinite(count) && count > entry.plays) {
    entry.plays = count;
    writeFileSync(file, JSON.stringify(entry, null, 2) + '\n');
    updated++;
  }
}
console.log(`✓ Synced ${updated} play counts from KV (${keys.length} keys). Rebuild + deploy to publish.`);
