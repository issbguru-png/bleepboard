import type { CollectionEntry } from 'astro:content';

/**
 * Gather the sounds belonging to a theme.
 *
 * A theme matches on substrings against a sound's slug, title and tags, which
 * is deliberately loose: "fah" needs to catch fahhh, fahhhh and "I Got This
 * (Fahhh)" without someone maintaining a hand-written list per theme.
 *
 * The looseness cuts both ways — "ahh" matches "Goofy Ahh" and would also
 * match "Rahhh" — so a theme's `match` array is a curated set of patterns, not
 * a keyword dump, and every hub's count should be eyeballed after a change.
 */
export function themeSounds(
  all: CollectionEntry<'sounds'>[],
  match: string[]
): CollectionEntry<'sounds'>[] {
  const pats = match.map((m) => m.toLowerCase()).filter(Boolean);
  return all
    .filter((s) => {
      const hay = [s.id, s.data.title, ...s.data.tags].join(' ').toLowerCase();
      return pats.some((p) => hay.includes(p));
    })
    .sort((a, b) => b.data.plays - a.data.plays);
}
