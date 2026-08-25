import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site';
import { urlset, isoDate } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog');
  return urlset(
    posts.map((p) => ({
      loc: `${SITE.url}/blog/${p.id}/`,
      lastmod: isoDate(p.data.updated ?? p.data.date),
    }))
  );
};
