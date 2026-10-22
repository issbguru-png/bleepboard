import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, soundPath, esSoundPath } from '../lib/site';
import { urlset, isoDate } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const sounds = await getCollection('sounds');
  return urlset([
    ...sounds.map((s) => ({
      loc: SITE.url + soundPath(s.id),
      lastmod: isoDate(s.data.added),
    })),
    // Keyed off the same `es` block that builds the route, so a Spanish URL
    // can never enter the sitemap before the page behind it exists.
    ...sounds
      .filter((s) => s.data.es)
      .map((s) => ({
        loc: SITE.url + esSoundPath(s.id),
        lastmod: isoDate(s.data.added),
      })),
  ]);
};
