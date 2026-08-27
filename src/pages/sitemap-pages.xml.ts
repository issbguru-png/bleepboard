import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';
import { urlset } from '../lib/sitemap';

export const GET: APIRoute = () => {
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
    '/about/',
    '/dmca/',
    '/privacy/',
  ];
  return urlset(pages.map((p) => ({ loc: SITE.url + p })));
};
