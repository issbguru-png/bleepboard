export const SITE = {
  name: 'Bleepboard',
  url: 'https://bleepboard.com',
  tagline: 'Instant sound buttons & meme soundboard',
  description:
    'Bleepboard is a free meme soundboard with instant sound buttons. Play, download, and share meme sounds, sound effects, and viral audio clips — no signup, no ads in your face.',
  twitter: '@bleepboard',
};

export function hubPath(categorySlug: string): string {
  return `/${categorySlug}-soundboard/`;
}

export function soundPath(slug: string): string {
  return `/sound/${slug}/`;
}

export function canonical(pathname: string): string {
  // normalize to trailing slash, absolute
  let p = pathname.endsWith('/') ? pathname : pathname + '/';
  return SITE.url + p;
}

export function fmtDuration(sec: number): string {
  return `${sec.toFixed(1).replace(/\.0$/, '')}s`;
}
