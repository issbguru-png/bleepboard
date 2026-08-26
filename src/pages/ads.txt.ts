import type { APIRoute } from 'astro';
import { ADSENSE_ID, MEDIAVINE_LIVE } from '../lib/monetization';

/**
 * ads.txt — the IAB authorised-sellers file.
 *
 * Generated rather than static, because a placeholder publisher ID is worse
 * than no file: crawlers treat an ads.txt with unrecognised entries as a
 * misconfiguration, and buyers may stop bidding on the inventory entirely.
 * With no ID configured this emits comments only, which is harmless.
 *
 * Mediavine maintains its own longer list — when you go live with them, take
 * the file contents from your Mediavine dashboard and add them here.
 */
export const GET: APIRoute = () => {
  const lines: string[] = [];

  if (ADSENSE_ID) {
    const pub = ADSENSE_ID.replace(/^ca-/, ''); // ads.txt wants pub-…, not ca-pub-…
    lines.push('# Google AdSense');
    lines.push(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`);
  }

  if (MEDIAVINE_LIVE) {
    lines.push('');
    lines.push('# Mediavine — paste the full list from your Mediavine dashboard below.');
    lines.push('# TODO (owner): Mediavine supplies dozens of authorised-seller lines.');
  }

  if (lines.length === 0) {
    lines.push('# No ad network configured yet.');
    lines.push('# Set ADSENSE_ID (and AD_NETWORK) in src/lib/monetization.ts and this');
    lines.push('# file will populate automatically on the next build.');
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
