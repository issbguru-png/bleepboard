/**
 * Cloudflare Pages Function: POST /api/play?slug={slug}
 * Increments a play counter in KV (binding: PLAYS).
 *
 * Setup (once, in the Cloudflare dashboard or wrangler):
 *   1. Create a KV namespace, e.g. `bleepboard-plays`
 *   2. Bind it to the Pages project as `PLAYS`
 *
 * Counts are synced back into the content JSONs periodically via
 * scripts/sync-plays.mjs so the static "trending" ordering reflects reality.
 */
interface Env {
  PLAYS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug') ?? '';
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return new Response('bad slug', { status: 400 });
  }
  const key = `plays:${slug}`;
  const current = parseInt((await context.env.PLAYS.get(key)) ?? '0', 10);
  await context.env.PLAYS.put(key, String(current + 1));
  return new Response(null, { status: 204 });
};
