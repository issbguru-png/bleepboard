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

  /* Turnstile does not hand over a token the instant the page loads. Measured
     on production 2026-11-21: the field is still empty at 7s and filled by
     8.5s. Anyone who submits inside that window hits the Worker with no token
     and gets a flat 403 telling them we could not verify they are a person,
     which reads as a rejection rather than "wait a moment". The form is slow
     to fill so most people never race it, but the ones who do get the worst
     possible message, and we have 116 form_starts and zero completions. */
  const tokenReady = () =>
    (form.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? '').length > 20;

  /** Give Turnstile up to `ms` to produce a token before giving up on it. */
  const waitForToken = async (ms: number) => {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      if (tokenReady()) return true;
      await new Promise((r) => setTimeout(r, 250));
    }
    return tokenReady();
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
    if (button) button.disabled = true;

    if (!tokenReady()) {
      say('Just a moment, finishing the robot check…', '');
      if (!(await waitForToken(15000))) {
        say('The robot check has not finished. Give it a few seconds and press send again.', 'error');
        if (button) button.disabled = false;
        return;
      }
    }

    say('Sending…', '');

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
