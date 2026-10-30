// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

/* Clips removed on rights grounds still have inbound links and index entries,
 * so their URLs redirect to the board they were on rather than 404ing.
 *
 * The list is data, written by scripts/fix-rights.mjs, so removing another
 * clip never means editing this file. Astro emits a meta-refresh page for each
 * one in a static build, which is what GitHub Pages can serve; after the
 * Cloudflare migration these become real 301s via public/_redirects.
 */
const removed = JSON.parse(readFileSync(new URL('./src/data/removed-sounds.json', import.meta.url), 'utf8'));
const redirects = Object.fromEntries(
  removed.map((r) => [`/sound/${r.slug}`, r.redirectTo])
);

// https://astro.build/config
export default defineConfig({
  site: 'https://bleepboard.com',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  compressHTML: true,
  redirects,
});
