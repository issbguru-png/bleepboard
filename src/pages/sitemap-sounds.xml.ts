import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, soundPath } from '../lib/site';
import { urlset, isoDate } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const sounds = await getCollection('sounds');
  return urlset(
    sounds.map((s) => ({
      loc: SITE.url + soundPath(s.id),
      lastmod: isoDate(s.data.added),
    }))
  );
};
