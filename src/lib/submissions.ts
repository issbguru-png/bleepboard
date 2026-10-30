/**
 * Submission config.
 *
 * The endpoint is a standalone Cloudflare Worker on workers.dev, not a Pages
 * Function. That was the unlock: a Worker runs without bleepboard.com being on
 * Cloudflare, so uploads no longer wait on migrating the site off GitHub
 * Pages. See workers/submit/.
 *
 * `SUBMIT_ENDPOINT_LIVE` stays false until the Worker is actually deployed and
 * SUBMIT_ENDPOINT below points at it. While false, /submit/ says submissions
 * are not open rather than rendering a form that posts into nothing and tells
 * a visitor their clip is under review when it was dropped by a 404. That is
 * the trap /api/play fell into for weeks.
 *
 * TURNSTILE_SITE_KEY has to be set at the same time: the Worker verifies the
 * token and fails closed without its secret, so a live form with no site key
 * would refuse every submission.
 */
export const SUBMIT_ENDPOINT_LIVE = true;

/** Full URL of the deployed Worker. Cross-origin, so its CORS allowlist in
 *  workers/submit/index.ts has to include this site. */
export const SUBMIT_ENDPOINT = 'https://bleepboard-submit.vidscall.workers.dev';

/** Cloudflare Turnstile site key. The public half of the pair: the secret is
 *  a Worker secret set with `wrangler secret put` and is not in this repo.
 *  The Worker fails closed without it, so these two travel together. */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFsNUWhe2WYOXSgy';

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
