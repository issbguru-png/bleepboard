/**
 * Cloudflare Pages Function: POST /api/submit
 *
 * Takes a sound submission from a visitor and parks it for review. It never
 * publishes anything. The only way a submission reaches the site is a human
 * running scripts/review-submissions.mjs and accepting it, which is what makes
 * the moderation claim on /submit/ true rather than decorative.
 *
 * Why moderation is not optional here: this site's measured audience is
 * school-age (weekday traffic is 4x weekend), and an open audio endpoint with
 * that audience is a safety problem before it is a copyright one. The
 * exclusions in docs/writing-blurbs.md are the review criteria.
 *
 * Storage (bindings must be declared in wrangler.toml or they are wiped on the
 * next deploy, see the note in that file):
 *   SUBMISSIONS   R2 bucket  — the uploaded audio, under pending/{id}.{ext}
 *   SUBMISSIONS_KV KV        — the metadata record, key submission:{id}
 *   TURNSTILE_SECRET         — Cloudflare Turnstile secret, anti-abuse
 *
 * This Function does not run on GitHub Pages. Until the Cloudflare migration
 * in docs/migrate-to-cloudflare.md is done, /submit/ falls back to email and
 * says so plainly rather than posting into a void.
 */

interface Env {
  SUBMISSIONS: R2Bucket;
  SUBMISSIONS_KV: KVNamespace;
  TURNSTILE_SECRET?: string;
}

/** 2 MB. A soundboard clip that does not fit in this is not a soundboard clip. */
const MAX_BYTES = 2 * 1024 * 1024;
const MIN_BYTES = 1024;

/** Extension by magic bytes. Content-Type is client-supplied, so it is a hint,
 *  not evidence: the sniff is what decides, and anything unrecognised is
 *  refused rather than stored under a guessed name. */
function sniff(buf: Uint8Array): 'mp3' | 'wav' | 'ogg' | null {
  const a = buf;
  if (a.length < 12) return null;
  // ID3 tag, or an MPEG frame sync
  if (a[0] === 0x49 && a[1] === 0x44 && a[2] === 0x33) return 'mp3';
  if (a[0] === 0xff && (a[1] & 0xe0) === 0xe0) return 'mp3';
  // RIFF....WAVE
  if (a[0] === 0x52 && a[1] === 0x49 && a[2] === 0x46 && a[3] === 0x46 &&
      a[8] === 0x57 && a[9] === 0x41 && a[10] === 0x56 && a[11] === 0x45) return 'wav';
  // OggS
  if (a[0] === 0x4f && a[1] === 0x67 && a[2] === 0x67 && a[3] === 0x53) return 'ogg';
  return null;
}

const clean = (v: FormDataEntryValue | null, max: number) =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

async function rateLimited(env: Env, ip: string): Promise<boolean> {
  // Three submissions per IP per hour. Crude, and deliberately so: the review
  // queue is the real control, this only stops a bored afternoon filling it.
  const key = `rate:${ip}:${Math.floor(Date.now() / 3_600_000)}`;
  const n = parseInt((await env.SUBMISSIONS_KV.get(key)) ?? '0', 10);
  if (n >= 3) return true;
  await env.SUBMISSIONS_KV.put(key, String(n + 1), { expirationTtl: 7200 });
  return false;
}

async function turnstileOk(env: Env, token: string, ip: string): Promise<boolean> {
  // Unset secret means the check is not configured yet. Fail closed in that
  // case rather than silently accepting everything.
  if (!env.TURNSTILE_SECRET) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const out = (await r.json()) as { success?: boolean };
  return out.success === true;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'Send the form as multipart/form-data.' });
  }

  if (!(await turnstileOk(env, clean(form.get('cf-turnstile-response'), 2048), ip))) {
    return json(403, { error: 'Could not verify that you are a person. Reload and try again.' });
  }
  if (await rateLimited(env, ip)) {
    return json(429, { error: 'Three submissions an hour is the limit. Try again later.' });
  }

  const title = clean(form.get('title'), 60);
  const sourceNote = clean(form.get('source'), 400);
  const contributorName = clean(form.get('name'), 40);
  const contact = clean(form.get('contact'), 120);
  const rights = form.get('rights') === 'on';

  if (title.length < 2) return json(400, { error: 'Give the sound a name.' });
  if (sourceNote.length < 10) {
    return json(400, { error: 'Say where the clip comes from. "I made it" is a fine answer.' });
  }
  if (contributorName.length < 2) {
    return json(400, { error: 'Give a name to credit, or write Anonymous.' });
  }
  if (!rights) {
    return json(400, { error: 'You have to confirm you have the right to share the clip.' });
  }

  const file = form.get('audio');
  if (!(file instanceof File)) return json(400, { error: 'Attach an audio file.' });
  if (file.size > MAX_BYTES) return json(413, { error: 'Audio must be under 2 MB.' });
  if (file.size < MIN_BYTES) return json(400, { error: 'That file is too small to be audio.' });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniff(bytes);
  if (!ext) return json(415, { error: 'Only MP3, WAV and OGG audio is accepted.' });

  // The id is ours. Nothing the client sent is used to build a storage path,
  // so there is no filename to traverse with.
  const id = crypto.randomUUID();
  const record = {
    id,
    title,
    sourceNote,
    contributorName,
    contact,
    ext,
    bytes: file.size,
    submittedAt: new Date().toISOString(),
    ip,
    userAgent: (request.headers.get('User-Agent') ?? '').slice(0, 300),
    status: 'pending' as const,
  };

  await env.SUBMISSIONS.put(`pending/${id}.${ext}`, bytes, {
    httpMetadata: { contentType: `audio/${ext === 'mp3' ? 'mpeg' : ext}` },
  });
  await env.SUBMISSIONS_KV.put(`submission:${id}`, JSON.stringify(record));

  return json(202, {
    ok: true,
    id,
    message: 'Submitted for review. Nothing goes live until a person has listened to it.',
  });
};
