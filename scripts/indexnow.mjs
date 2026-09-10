#!/usr/bin/env node
/**
 * IndexNow submitter.
 *
 * Why this exists: analytics for the week of 2026-09-03 showed Bing driving
 * 296 organic sessions against Google's 114, and with DuckDuckGo and Yahoo
 * (both Bing-powered) that is roughly three quarters of all search traffic.
 * IndexNow is Bing's push-notification protocol: instead of waiting to be
 * crawled, we tell it what changed. Google does not participate, which is
 * fine, since Google is not the channel that needs help here.
 *
 * How it decides what to submit:
 *   --all           every URL in the built sitemaps (use sparingly, see below)
 *   --since <ref>   URLs whose source files changed since a git ref
 *   (default)       --since HEAD~1, i.e. what this push actually changed
 *   --dry           print the payload and exit without calling the API
 *
 * Submitting everything on every deploy is the one way to get throttled, so
 * the default is deliberately the narrow one. `--all` is for the first run and
 * for a structural change like a new sitemap.
 *
 * The key file must be reachable at https://bleepboard.com/<key>.txt and must
 * contain exactly the key. That is what proves we own the domain.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'bleepboard.com';
const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
/** IndexNow caps a single submission at 10,000 URLs. */
const MAX_URLS = 10000;

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const valueOf = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

// ---------------------------------------------------------------- the key
function findKey() {
  const pub = resolve(root, 'public');
  const f = readdirSync(pub).find((n) => /^[0-9a-f]{32}\.txt$/.test(n));
  if (!f) {
    console.error('No IndexNow key file found in public/. Expected <32-hex>.txt');
    process.exit(1);
  }
  const key = basename(f, '.txt');
  const contents = readFileSync(resolve(pub, f), 'utf8').trim();
  if (contents !== key) {
    // A key file whose body does not match its filename fails verification
    // silently: IndexNow just stops accepting submissions, with no error here.
    console.error(`Key file ${f} contains "${contents}", expected "${key}"`);
    process.exit(1);
  }
  return key;
}

// ---------------------------------------------------------------- url sets
function urlsFromSitemaps() {
  const dist = resolve(root, 'dist');
  if (!existsSync(dist)) {
    console.error('No dist/. Run `npm run build` first.');
    process.exit(1);
  }
  const urls = new Set();
  for (const f of readdirSync(dist).filter((n) => n.startsWith('sitemap') && n.endsWith('.xml'))) {
    const xml = readFileSync(resolve(dist, f), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (!m[1].includes('sitemap')) urls.add(m[1]);
    }
  }
  return [...urls];
}

/**
 * Map changed source files to the URLs they render.
 *
 * Deliberately conservative: a changed layout, component or stylesheet touches
 * every page, and claiming "everything changed" on a CSS tweak is exactly the
 * abuse the protocol asks you not to commit. Those return null so the caller
 * can decide, rather than silently submitting 1,300 URLs.
 */
function urlsForFile(file) {
  const m = (re, fn) => {
    const r = file.match(re);
    return r ? fn(r) : null;
  };
  return (
    m(/^src\/content\/sounds\/(.+)\.json$/, (r) => [`${ORIGIN}/sound/${r[1]}/`]) ??
    m(/^src\/content\/blog\/(.+)\.md$/, (r) => [`${ORIGIN}/blog/${r[1]}/`]) ??
    m(/^src\/content\/(categories|themes)\/(.+)\.json$/, (r) => [
      `${ORIGIN}/${r[2]}-soundboard/`,
      `${ORIGIN}/es/${r[2]}-soundboard/`,
    ]) ??
    m(/^src\/pages\/(.+)\.astro$/, (r) => {
      const p = r[1];
      if (p.includes('[')) return null; // dynamic route, too broad to map
      if (p === 'index') return [`${ORIGIN}/`];
      if (p === 'es/index') return [`${ORIGIN}/es/`];
      return [`${ORIGIN}/${p}/`];
    })
  );
}

function urlsFromGit(since) {
  let changed;
  try {
    changed = execFileSync('git', ['diff', '--name-only', `${since}..HEAD`], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
  } catch {
    console.error(`Could not diff against ${since}. Falling back to nothing.`);
    return [];
  }
  const urls = new Set();
  let broad = false;
  for (const f of changed) {
    const mapped = urlsForFile(f);
    if (mapped) mapped.forEach((u) => urls.add(u));
    else if (/^src\/(layouts|components|styles|lib)\//.test(f)) broad = true;
  }
  if (broad && urls.size === 0) {
    // Shared code changed but no individual page did. The homepage is the one
    // URL worth nudging: it is 51% of our pageviews and 66% of organic landings.
    urls.add(`${ORIGIN}/`);
  }
  return [...urls];
}

// ---------------------------------------------------------------- submit
async function main() {
  const key = findKey();
  const all = has('--all');
  const since = valueOf('--since') ?? 'HEAD~1';
  let urls = all ? urlsFromSitemaps() : urlsFromGit(since);

  if (urls.length === 0) {
    console.log('IndexNow: nothing to submit (no page-level changes detected).');
    return;
  }
  if (urls.length > MAX_URLS) {
    console.log(`IndexNow: trimming ${urls.length} URLs to the ${MAX_URLS} cap.`);
    urls = urls.slice(0, MAX_URLS);
  }

  const payload = {
    host: HOST,
    key,
    keyLocation: `${ORIGIN}/${key}.txt`,
    urlList: urls,
  };

  console.log(`IndexNow: ${urls.length} URL(s)${all ? ' (full sitemap)' : ` since ${since}`}`);
  for (const u of urls.slice(0, 10)) console.log(`  ${u}`);
  if (urls.length > 10) console.log(`  ...and ${urls.length - 10} more`);

  if (has('--dry')) {
    console.log('Dry run, nothing sent.');
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  // 200 accepted, 202 accepted but key still being validated. Both are fine.
  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow: accepted (HTTP ${res.status}).`);
    return;
  }
  // Never fail the deploy over this. A search-engine ping is not worth blocking
  // a release that has already built and passed its audit.
  console.error(`IndexNow: HTTP ${res.status}. ${await res.text().catch(() => '')}`.trim());
  console.error('Continuing anyway; submission is advisory, not part of the build.');
}

main().catch((err) => {
  console.error('IndexNow: request failed,', err.message);
});
