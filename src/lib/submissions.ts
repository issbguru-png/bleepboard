/**
 * Submission config.
 *
 * `SUBMIT_ENDPOINT_LIVE` is the honest switch. functions/api/submit.ts is
 * Cloudflare code, and the site is still on GitHub Pages, where Functions do
 * not run. That is the same trap /api/play fell into: shipped, wired up, and
 * silently 404ing in production for weeks.
 *
 * So while this is false, /submit/ shows the email route and says the upload
 * form is not open yet, rather than rendering a form that posts into nothing
 * and tells the visitor their clip is under review when it was discarded by a
 * 404. Flip it in the same change that completes docs/migrate-to-cloudflare.md,
 * and set TURNSTILE_SITE_KEY at the same time or the endpoint fails closed.
 */
export const SUBMIT_ENDPOINT_LIVE = false;

/** Cloudflare Turnstile site key (public half). Pairs with the
 *  TURNSTILE_SECRET Pages secret the Function verifies against. */
export const TURNSTILE_SITE_KEY = '';

/** Where submissions go while the endpoint is not live. */
export const SUBMIT_EMAIL = 'sounds@bleepboard.com';

/**
 * Can bleepboard.com actually receive email?
 *
 * Checked 2026-10-30: the domain has NO MX records on any resolver, so every
 * address the site advertises (dmca@, hello@, privacy@, and this one) silently
 * discards anything sent to it. Nothing bounces to the sender either; it just
 * goes nowhere.
 *
 * So this stays false and /submit/ does not print a mailto a visitor would
 * trust. Set up mail routing (Cloudflare Email Routing is free, or forwarding
 * at the registrar, which is Dynadot per the NS records), send yourself a test
 * message, and only then flip this.
 *
 * The far more urgent consequence is not this page: dmca@bleepboard.com is the
 * takedown route on /dmca/ and on the report menu of all 650 sound pages, and
 * it is dead. See docs/submissions.md.
 */
export const SUBMIT_EMAIL_LIVE = false;

/** Hard limits, mirrored from functions/api/submit.ts so the page can state
 *  them before a visitor uploads 40 MB over mobile data and is refused. */
export const MAX_MB = 2;
export const ACCEPTED = ['MP3', 'WAV', 'OGG'] as const;
