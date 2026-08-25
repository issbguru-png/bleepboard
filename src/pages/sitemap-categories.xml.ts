import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, hubPath } from '../lib/site';
import { urlset } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const categories = await getCollection('categories');
  return urlset(categories.map((c) => ({ loc: SITE.url + hubPath(c.id) })));
};
