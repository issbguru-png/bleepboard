import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site';
import { urlset } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const pages = [
    '/',
    // Spanish landing page. Same rank as the home page it mirrors, and it is a
    // real page rather than a translation redirect, so it belongs in the map.
    '/es/',
    '/new/',
    '/trending/',
    '/categories/',
    '/unblocked-soundboard/',
    '/blog/',
    '/submit/',
    '/contributors/',
    '/about/',
    '/contact/',
    '/dmca/',
    '/privacy/',
    '/terms/',
  ];
  // Contributor pages are generated from the collection, so listing them by
  // hand would go stale the first time a submission is accepted.
  const people = await getCollection('contributors');
  return urlset([
    ...pages.map((p) => ({ loc: SITE.url + p })),
    ...people.map((p) => ({ loc: `${SITE.url}/contributors/${p.id}/` })),
  ]);
};
