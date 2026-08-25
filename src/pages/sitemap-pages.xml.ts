import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';
import { urlset } from '../lib/sitemap';

export const GET: APIRoute = () => {
  const pages = ['/', '/new/', '/trending/', '/categories/', '/blog/', '/about/', '/dmca/'];
  return urlset(pages.map((p) => ({ loc: SITE.url + p })));
};
