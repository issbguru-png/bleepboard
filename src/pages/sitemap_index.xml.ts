import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

export const GET: APIRoute = () => {
  const today = new Date().toISOString().slice(0, 10);
  const maps = ['sitemap-sounds.xml', 'sitemap-categories.xml', 'sitemap-blog.xml', 'sitemap-pages.xml'];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    maps
      .map((m) => `  <sitemap><loc>${SITE.url}/${m}</loc><lastmod>${today}</lastmod></sitemap>`)
      .join('\n') +
    `\n</sitemapindex>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
