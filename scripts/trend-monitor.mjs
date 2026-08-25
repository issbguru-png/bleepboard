#!/usr/bin/env node
/**
 * Bleepboard trend monitor — daily digest of rising queries that look like sounds/memes.
 *
 * Sources (no API keys needed):
 *  - Google Trends daily trending RSS (US)
 *  - Competitor "new sounds" pages can be added as fetch targets later
 *
 * Usage: node scripts/trend-monitor.mjs
 * Wire into cron / a scheduled GitHub Action for a daily digest.
 */
const SOUND_HINTS = [
  'sound', 'soundboard', 'meme', 'audio', 'song', 'sfx', 'voice', 'noise',
  'brainrot', 'tiktok sound', 'sound effect',
];

async function googleTrends() {
  const res = await fetch('https://trends.google.com/trending/rss?geo=US', {
    headers: { 'User-Agent': 'Mozilla/5.0 (bleepboard-trend-monitor)' },
  });
  const xml = await res.text();
  const items = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)]
    .map((m) => m[1])
    .slice(1); // first <title> is the feed title
  return items;
}

const trends = await googleTrends().catch((e) => {
  console.error('trends fetch failed:', e.message);
  return [];
});

const soundish = trends.filter((t) =>
  SOUND_HINTS.some((h) => t.toLowerCase().includes(h))
);

console.log(`# Bleepboard trend digest — ${new Date().toISOString().slice(0, 10)}\n`);
console.log(`## Sound-adjacent rising queries (${soundish.length})`);
for (const t of soundish) console.log(`- ${t}`);
console.log(`\n## All rising queries (${trends.length}) — scan for meme candidates`);
for (const t of trends) console.log(`- ${t}`);
console.log(`\nNext step for any candidate: ship /sound/{slug}/ + explainer within 48h (scripts/add-sound.mjs).`);
