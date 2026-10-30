#!/usr/bin/env node
/**
 * The review gate for visitor submissions.
 *
 *   node scripts/review-submissions.mjs --list
 *   node scripts/review-submissions.mjs --pull            # from Cloudflare, after migration
 *   node scripts/review-submissions.mjs --accept <id> --slug <slug> --category <cat>
 *   node scripts/review-submissions.mjs --reject <id> --reason "..."
 *
 * This is the only path from a submission to the published site. /submit/ tells
 * visitors a person listens to every clip before it goes up, and this script is
 * what makes that true rather than a claim.
 *
 * It deliberately will NOT write the blurb for you. Accepting a clip leaves the
 * sound JSON with an empty blurb, and `npm run audit` fails until a human has
 * written one. The copy is the site's whole argument (docs/writing-blurbs.md),
 * and a submission queue is exactly where templated filler would start.
 *
 * It also will not invent a contributor. A contributor file is created only
 * from a submission record naming them, because that record is what a takedown
 * notice is answered with and what decides whether a clip was stored at the
 * direction of a user. Attribution is a factual claim, not a label.
 *
 * ── THE QUEUE ───────────────────────────────────────────────────────────────
 * Two sources, same shape:
 *   data/submissions/*.json  local, used for the email route while the upload
 *                            endpoint is not live. Audio sits beside it.
 *   Cloudflare KV + R2       once functions/api/submit.ts is reachable; --pull
 *                            drains them into data/submissions/.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, renameSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE = resolve(root, 'data/submissions');
const DONE = resolve(QUEUE, 'reviewed');
const SOUNDS = resolve(root, 'src/content/sounds');
const CONTRIBUTORS = resolve(root, 'src/content/contributors');
const AUDIO = resolve(root, 'public/audio');

const RED = '\x1b[31m', YEL = '\x1b[33m', GRN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

for (const d of [QUEUE, DONE, CONTRIBUTORS]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

const queue = () =>
  readdirSync(QUEUE)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: resolve(QUEUE, f), ...JSON.parse(readFileSync(resolve(QUEUE, f), 'utf8')) }));

/** Slug from a display name, used for the contributor id. Collisions get a
 *  numeric suffix rather than silently merging two different people. */
function contributorId(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'contributor';
  let id = base;
  let n = 2;
  while (existsSync(resolve(CONTRIBUTORS, `${id}.json`))) {
    const existing = JSON.parse(readFileSync(resolve(CONTRIBUTORS, `${id}.json`), 'utf8'));
    if (existing.name === name) return id; // same person submitting again
    id = `${base}-${n++}`;
  }
  return id;
}

function listQueue() {
  const items = queue();
  if (!items.length) {
    console.log(`${DIM}Nothing waiting. Submissions land in data/submissions/.${OFF}`);
    return;
  }
  console.log(`\n${items.length} waiting:\n`);
  for (const s of items) {
    console.log(`  ${YEL}${s.id}${OFF}  ${s.title}`);
    console.log(`    by        ${s.contributorName}${s.contact ? ` <${s.contact}>` : ''}`);
    console.log(`    source    ${s.sourceNote}`);
    console.log(`    file      ${s.audioFile ?? '(missing)'}  ${s.bytes ? `${Math.round(s.bytes / 1024)} KB` : ''}`);
    console.log(`    sent      ${s.submittedAt}\n`);
  }
  console.log(`${DIM}Listen to the file, check it against the refusal list in`);
  console.log(`docs/writing-blurbs.md, then --accept or --reject.${OFF}\n`);
}

function pull() {
  // Drains Cloudflare into the local queue so review happens against real files
  // rather than through a dashboard. Needs wrangler and the bindings live.
  console.log('Pulling pending submissions from Cloudflare…');
  let keys;
  try {
    const out = execFileSync('npx', ['wrangler', 'kv', 'key', 'list', '--binding', 'SUBMISSIONS_KV', '--prefix', 'submission:'], {
      cwd: root, encoding: 'utf8',
    });
    keys = JSON.parse(out).map((k) => k.name);
  } catch (e) {
    console.error(`${RED}Could not reach Cloudflare KV.${OFF}`);
    console.error(`${DIM}This needs the migration in docs/migrate-to-cloudflare.md to be done,`);
    console.error(`and the bindings in wrangler.toml to be created. Until then submissions`);
    console.error(`arrive by email and you drop them into data/submissions/ by hand.${OFF}`);
    process.exit(1);
  }
  let n = 0;
  for (const key of keys) {
    const raw = execFileSync('npx', ['wrangler', 'kv', 'key', 'get', key, '--binding', 'SUBMISSIONS_KV'], { cwd: root, encoding: 'utf8' });
    const rec = JSON.parse(raw);
    if (rec.status !== 'pending') continue;
    const audio = `${rec.id}.${rec.ext}`;
    execFileSync('npx', ['wrangler', 'r2', 'object', 'get', `bleepboard-submissions/pending/${audio}`, '--file', resolve(QUEUE, audio)], { cwd: root });
    writeFileSync(resolve(QUEUE, `${rec.id}.json`), JSON.stringify({ ...rec, audioFile: audio }, null, 2) + '\n');
    n++;
  }
  console.log(`${GRN}Pulled ${n}.${OFF} Run --list.`);
}

function accept() {
  const id = val('--accept');
  const slug = val('--slug');
  const category = val('--category');
  if (!slug || !/^[a-z0-9-]{2,60}$/.test(slug)) {
    console.error(`${RED}--slug is required: lowercase, digits and hyphens.${OFF}`);
    process.exit(1);
  }
  if (!category) {
    console.error(`${RED}--category is required.${OFF}`);
    process.exit(1);
  }
  const cats = readdirSync(resolve(root, 'src/content/categories')).map((f) => basename(f, '.json'));
  if (!cats.includes(category)) {
    console.error(`${RED}Unknown category "${category}".${OFF} One of: ${cats.join(', ')}`);
    process.exit(1);
  }
  if (existsSync(resolve(SOUNDS, `${slug}.json`))) {
    console.error(`${RED}A sound called "${slug}" already exists.${OFF}`);
    process.exit(1);
  }

  const sub = queue().find((s) => s.id === id);
  if (!sub) {
    console.error(`${RED}No submission ${id} in the queue.${OFF}`);
    process.exit(1);
  }
  const audioSrc = resolve(QUEUE, sub.audioFile ?? '');
  if (!sub.audioFile || !existsSync(audioSrc)) {
    console.error(`${RED}Audio file for ${id} is missing from data/submissions/.${OFF}`);
    process.exit(1);
  }
  if (extname(audioSrc) !== '.mp3') {
    console.error(`${RED}Convert to MP3 before accepting.${OFF} The site serves .mp3 only.`);
    console.error(`${DIM}  ffmpeg -i "${audioSrc}" -codec:a libmp3lame -b:a 128k "${resolve(QUEUE, slug + '.mp3')}"${OFF}`);
    process.exit(1);
  }

  // Contributor, created from the submission and only from the submission.
  const cid = contributorId(sub.contributorName);
  const cFile = resolve(CONTRIBUTORS, `${cid}.json`);
  if (!existsSync(cFile)) {
    writeFileSync(cFile, JSON.stringify({
      name: sub.contributorName,
      editorial: false,
      joined: sub.submittedAt ?? new Date().toISOString(),
    }, null, 2) + '\n');
    console.log(`${GRN}New contributor${OFF} ${cid}`);
  }

  copyFileSync(audioSrc, resolve(AUDIO, `${slug}.mp3`));

  writeFileSync(resolve(SOUNDS, `${slug}.json`), JSON.stringify({
    title: sub.title,
    category,
    tags: [],
    duration: 0,
    audio: `/audio/${slug}.mp3`,
    // Left empty on purpose. The audit fails until somebody writes it, which
    // is the point: see the note at the top of this file.
    blurb: '',
    origin: '',
    added: new Date().toISOString(),
    featured: false,
    plays: 0,
    contributor: cid,
    sourceNote: sub.sourceNote,
  }, null, 2) + '\n');

  renameSync(sub.file, resolve(DONE, basename(sub.file)));
  renameSync(audioSrc, resolve(DONE, basename(audioSrc)));

  console.log(`\n${GRN}Accepted${OFF} ${id} as ${slug}, credited to ${sub.contributorName}.`);
  console.log(`\n${YEL}Three things left, and the build fails until they are done:${OFF}`);
  console.log(`  1. Write the blurb in src/content/sounds/${slug}.json (70-110 words).`);
  console.log(`  2. Set "duration" to the real length in seconds.`);
  console.log(`  3. Add tags, and fill "origin" from what the submitter told you.`);
  console.log(`\n${DIM}Then: npm run audit && npm run build${OFF}\n`);
}

function reject() {
  const id = val('--reject');
  const reason = val('--reason') ?? '';
  const sub = queue().find((s) => s.id === id);
  if (!sub) {
    console.error(`${RED}No submission ${id} in the queue.${OFF}`);
    process.exit(1);
  }
  writeFileSync(resolve(DONE, `${id}.json`), JSON.stringify({
    ...sub, file: undefined, status: 'rejected', reason, reviewedAt: new Date().toISOString(),
  }, null, 2) + '\n');
  renameSync(sub.file, resolve(DONE, `${id}.submitted.json`));
  const audio = resolve(QUEUE, sub.audioFile ?? '');
  if (sub.audioFile && existsSync(audio)) renameSync(audio, resolve(DONE, basename(audio)));
  console.log(`${GRN}Rejected${OFF} ${id}.${reason ? ` Reason recorded: ${reason}` : ''}`);
  if (sub.contact) console.log(`${DIM}They left ${sub.contact}, so tell them.${OFF}`);
}

if (has('--pull')) pull();
else if (has('--accept')) accept();
else if (has('--reject')) reject();
else listQueue();
