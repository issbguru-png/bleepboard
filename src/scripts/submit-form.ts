/**
 * Progressive enhancement for the /upload/ form.
 *
 * The form posts natively without this file, which is the point: if the script
 * fails to load, a visitor still gets a working submission and a plain response
 * page rather than a button that does nothing. This only upgrades it to an
 * in-page result so nobody loses the tab they were on.
 */
const form = document.querySelector<HTMLFormElement>('.submit-form');
const note = document.querySelector<HTMLElement>('[data-submit-status]');

if (form && note) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const MAX_BYTES = 2 * 1024 * 1024;

  const say = (text: string, state: 'ok' | 'error' | '') => {
    note.textContent = text;
    if (state) note.dataset.state = state;
    else delete note.dataset.state;
  };

  form.addEventListener('submit', async (e) => {
    const file = form.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0];
    // Checked here as well as on the server so somebody on a phone connection
    // is not made to upload 10 MB before being told no.
    if (file && file.size > MAX_BYTES) {
      e.preventDefault();
      say('That file is over 2 MB. Trim the clip and try again.', 'error');
      return;
    }

    e.preventDefault();
    say('Sending…', '');
    if (button) button.disabled = true;

    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (res.ok) {
        form.hidden = true;
        say(data.message ?? 'Submitted for review. Nothing goes live until a person has listened to it.', 'ok');
        return;
      }
      say(data.error ?? `Something went wrong (${res.status}). Try again in a minute.`, 'error');
    } catch {
      say('Could not reach the server. Check your connection and try again.', 'error');
    } finally {
      if (button) button.disabled = false;
      // Turnstile tokens are single use, so a retry needs a fresh one.
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
    }
  });
}
