# Submission queue

Pending visitor submissions land here, one JSON plus its audio file per
submission, and `scripts/review-submissions.mjs` moves them out.

While the site is on GitHub Pages the upload endpoint cannot run, so
submissions arrive by email at the address in `src/lib/submissions.ts`. Save
the attachment here as `{id}.mp3` and write the matching `{id}.json`:

```json
{
  "id": "2026-10-29-kettle",
  "title": "Kettle Click",
  "sourceNote": "What the sender said about where it came from, verbatim.",
  "contributorName": "Name to credit",
  "contact": "them@example.com",
  "ext": "mp3",
  "submittedAt": "2026-10-29T10:14:00.000Z",
  "status": "pending",
  "audioFile": "2026-10-29-kettle.mp3"
}
```

Then `node scripts/review-submissions.mjs --list`.

After the Cloudflare migration, `--pull` drains the real queue into this folder
instead and the email route goes away.

Reviewed items move to `reviewed/`, which is the record of what was accepted
and refused and why. Keep it: it is the evidence that review actually happens,
and it is what you would produce if a rights holder ever asked.

Nothing in this folder is published. The site only renders what the review
script has promoted into `src/content/`.
