// Sound-page actions: Share (native sheet, or an anchored fallback menu),
// Favourite (localStorage), and Report (mailto). Nothing here talks to a
// server, because there isn't one — every action is either a browser API or
// a real link.

import { readFavourites, storageAvailable, toggleFavourite } from './favourites';

const MENU_SEL = '.actions-menu';
const ITEM_SEL = '.menu-item';
const NARROW = '(max-width: 560px)';

let openTrigger: HTMLElement | null = null;

function menuOf(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-controls');
  return id ? document.getElementById(id) : null;
}

function items(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SEL));
}

/** Anchor the menu under its trigger. The menu is position:fixed, so it
 *  escapes the hero's overflow:hidden and never shifts the page. On narrow
 *  screens CSS turns it into a bottom sheet, so we clear the inline offsets. */
function place(trigger: HTMLElement, menu: HTMLElement): void {
  if (window.matchMedia(NARROW).matches) {
    menu.style.top = '';
    menu.style.left = '';
    return;
  }
  const t = trigger.getBoundingClientRect();
  menu.style.top = '0px';
  menu.style.left = '0px';
  const m = menu.getBoundingClientRect();
  const pad = 12;
  let left = Math.min(t.left, window.innerWidth - m.width - pad);
  left = Math.max(pad, left);
  let top = t.bottom + 8;
  if (top + m.height > window.innerHeight - pad) {
    top = Math.max(pad, t.top - m.height - 8);
  }
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function closeMenu(refocus = false): void {
  const trigger = openTrigger;
  if (!trigger) return;
  const menu = menuOf(trigger);
  trigger.setAttribute('aria-expanded', 'false');
  if (menu) {
    menu.hidden = true;
    menu.style.top = '';
    menu.style.left = '';
  }
  openTrigger = null;
  if (refocus) trigger.focus();
}

function openMenu(trigger: HTMLElement): void {
  if (openTrigger === trigger) {
    closeMenu(true);
    return;
  }
  closeMenu();
  const menu = menuOf(trigger);
  if (!menu) return;
  menu.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  openTrigger = trigger;
  place(trigger, menu);
  items(menu)[0]?.focus();
}

/** Share: the native sheet where it exists (that's the good phone experience),
 *  the fallback menu everywhere else. */
function handleShare(trigger: HTMLElement): void {
  const url = trigger.dataset.shareUrl;
  const title = trigger.dataset.shareTitle;
  const text = trigger.dataset.shareText || title;
  if (!url || typeof navigator.share !== 'function') {
    openMenu(trigger);
    return;
  }
  try {
    navigator.share({ title, text, url }).catch((err: unknown) => {
      const name = (err as { name?: string } | null)?.name;
      // The user closing the sheet is a completed action, not a failure.
      if (name === 'AbortError' || name === 'NotAllowedError') return;
      openMenu(trigger);
    });
  } catch {
    openMenu(trigger);
  }
}

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;

  const trigger = target.closest<HTMLElement>('[data-menu]');
  if (trigger) {
    e.preventDefault();
    if (trigger.dataset.menu === 'share') handleShare(trigger);
    else openMenu(trigger);
    return;
  }

  if (!openTrigger) return;
  const menu = target.closest<HTMLElement>(MENU_SEL);
  if (!menu) {
    closeMenu();
    return;
  }
  // Picking something dismisses the menu — except Copy link, which needs to
  // stay put long enough for you to read "Copied!".
  const item = target.closest<HTMLElement>(ITEM_SEL);
  if (item && !item.hasAttribute('data-copy')) closeMenu();
});

document.addEventListener('keydown', (e) => {
  if (!openTrigger) return;
  const menu = menuOf(openTrigger);
  if (!menu) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeMenu(true);
    return;
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
  const list = items(menu);
  if (!list.length || !menu.contains(document.activeElement)) return;
  e.preventDefault();
  const i = list.indexOf(document.activeElement as HTMLElement);
  const next =
    e.key === 'Home' ? 0
    : e.key === 'End' ? list.length - 1
    : e.key === 'ArrowDown' ? (i + 1) % list.length
    : (i - 1 + list.length) % list.length;
  list[next].focus();
});

// Tabbing out of the menu closes it — focus is never trapped.
document.addEventListener('focusin', (e) => {
  if (!openTrigger) return;
  const menu = menuOf(openTrigger);
  const node = e.target as Node;
  if (menu && !menu.contains(node) && node !== openTrigger) closeMenu();
});

// Keep it anchored rather than yanking it shut mid-scroll.
const reflow = () => {
  if (openTrigger) {
    const menu = menuOf(openTrigger);
    if (menu) place(openTrigger, menu);
  }
};
window.addEventListener('scroll', reflow, { passive: true });
window.addEventListener('resize', reflow);

/* ---------------------------------------------------------------- favourite */

const favBtn = document.querySelector<HTMLButtonElement>('[data-fav]');

function syncCount(): void {
  const el = document.querySelector<HTMLElement>('[data-fav-count]');
  if (!el) return;
  const n = readFavourites().length;
  el.textContent = n ? ` (${n})` : '';
}

if (favBtn) {
  const slug = favBtn.dataset.fav!;

  if (!storageAvailable()) {
    // Honest degradation: the control is visibly unavailable and says why,
    // rather than accepting taps it can't remember.
    favBtn.disabled = true;
    favBtn.setAttribute('aria-disabled', 'true');
    document.querySelector('[data-fav-warn]')?.removeAttribute('hidden');
    document.querySelector('[data-fav-nav]')?.setAttribute('hidden', '');
  } else {
    const paint = (on: boolean) => favBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    paint(readFavourites().indexOf(slug) > -1);
    syncCount();

    favBtn.addEventListener('click', () => {
      paint(toggleFavourite(slug));
      syncCount();
    });

    // Saved in another tab? Reflect it here.
    window.addEventListener('storage', () => {
      paint(readFavourites().indexOf(slug) > -1);
      syncCount();
    });
  }
}
