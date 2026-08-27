import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, hubPath } from '../lib/site';
import { urlset } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const categories = await getCollection('categories');
  // Themed hubs live at the same URL shape and belong in the same sitemap.
  const themes = await getCollection('themes');
  return urlset([
    ...categories.map((c) => ({ loc: SITE.url + hubPath(c.id) })),
    ...themes.map((t) => ({ loc: SITE.url + hubPath(t.id) })),
  ]);
};
