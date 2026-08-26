// Favourites live entirely in this browser: no account, no server, no sync.
// Every entry point is wrapped, because localStorage throws (not returns null)
// in private windows and when site data is blocked.

export const FAV_KEY = 'bleepboard:favourites';

/** Feature-detect *writable* storage — presence of the API isn't enough. */
export function storageAvailable(): boolean {
  try {
    const probe = '__bb_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Saved slugs, most recently saved first. Always an array. */
export function readFavourites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function writeFavourites(list: string[]): boolean {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function isFavourite(slug: string): boolean {
  return readFavourites().indexOf(slug) > -1;
}

/** Toggle and return the resulting state (true = saved). */
export function toggleFavourite(slug: string): boolean {
  const list = readFavourites();
  const i = list.indexOf(slug);
  if (i > -1) {
    list.splice(i, 1);
    writeFavourites(list);
    return false;
  }
  list.unshift(slug);
  writeFavourites(list);
  return true;
}

export function removeFavourite(slug: string): string[] {
  const list = readFavourites().filter((s) => s !== slug);
  writeFavourites(list);
  return list;
}
