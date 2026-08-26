# Writing sound blurbs

Every sound page on Bleepboard carries a hand-written description. That is the
entire competitive argument of this site: rival soundboards ship templated
filler, we ship writing that tells you where a clip came from. If the copy stops
being good, there is no reason to prefer us.

In August 2026 the whole corpus was rewritten because it read as machine-written
— the same sentence shape over and over, an em-dash in every other clause. This
document exists so that never happens again as new sounds land.

Run `node scripts/audit-copy.mjs` before you commit new sounds. It counts every
tell listed here and exits non-zero if the corpus regresses.

---

## The hard rules (enforced)

| Rule | Where it's enforced |
|---|---|
| 70–110 words | `audit-copy.mjs`; import scripts reject under 40 |
| ≥200 characters | `src/content.config.ts` schema — build fails |
| No duplicate blurb | `audit-copy.mjs` |
| No two blurbs sharing a four-word opening | `audit-copy.mjs` |
| Facts accurate, never invented | Human judgement. See "Facts" below. |

## The soft rules (audited, use judgement)

These are targets for the corpus, not per-blurb laws. One blurb breaking one of
them is fine. Fifty is the problem.

| Target | Why |
|---|---|
| Em-dashes: about **1 per 3–4 blurbs** | Overuse is the single loudest AI tell. **Zero is also a tell** — don't strip them all. |
| Never two em-dashes in one blurb | Reads as machine cadence instantly. |
| Never open `Name — appositive` | 74 blurbs once shared this exact shape. It's invisible per-blurb and obvious across a grid. |
| Vary sentence length | Every sentence 15–25 words is a tell in itself. Land a short one. |
| Vary openings between neighbours | Sounds in a category render side by side. |

---

## Banned constructions

These were stripped from the corpus. Don't reintroduce them.

- **`which is exactly why…`** / `which is precisely what…` / `which is what makes it…`
  (74 instances removed)
- **Bolted-on emphasis fragments**: `That's the joke.` `That's the entire point.`
  `That's the bit.` `Every single time.`
- **`It's not just X, it's Y`** and `isn't merely X — it's Y`
- **`Whether you're X or Y`** openings
- **Padding triads** — three parallel items where two do the work:
  ~~"short, punchy, and weirdly satisfying"~~. A real enumeration of facts
  ("FNAF 1, 2 and 4") is fine and is not a triad.
- **Over-hedged superlatives**: `arguably the most`, `quite possibly the`
- **Stock AI vocabulary**: delve, elevate, seamless, robust, leverage,
  testament, tapestry, boasts, "at its core", "in the realm of", "unpack"

---

## How to actually fix a tell

**Do not find-and-replace.** Swapping every `—` for a comma leaves prose that
still reads as machine-made, just worse punctuated. Rewrite the sentence so the
dash isn't needed: split it in two, reorder the clause, or cut the aside.

Worked examples from the rewrite:

**Opening dash-appositive + "which is exactly why"**
> ❌ TUNG TUNG TUNG SAHUR — a rhythm borrowed from the Indonesian sahur
> tradition… The drum pattern is relentless by design — it was built to wake
> people up — which is exactly why it refuses to leave your head.

> ✅ TUNG TUNG TUNG SAHUR. The rhythm is borrowed from the Indonesian sahur
> tradition… The drum pattern was built to drag people out of sleep, so
> naturally it refuses to leave your head once it has got in there.

**Dash-pair aside → two sentences of different shape**
> ❌ "Six seven" — always said as two separate numbers, never "sixty-seven" —
> is a piece of pure verbal confetti.

> ✅ "Six seven" is always said as two separate numbers, never "sixty-seven".
> It's pure verbal confetti.

**Hedged superlative removed without losing the claim**
> ❌ Radar — the default iPhone alarm, and quite possibly the most hated sound
> on the planet.

> ✅ Radar is the default iPhone alarm, and few sounds on the planet are more
> widely resented.

---

## Voice

Playful, knowledgeable, a bit wry. British/neutral English (`colour`,
`recognise`, `synthesised`). Second person where it's natural. You're writing
for someone who came from Google, wants the clip, and will stay an extra ten
seconds if you tell them something they didn't know.

A good blurb usually does three things:

1. **Says what the sound is** in a way that confirms they've found the right one.
2. **Says where it came from** — the film, game, year, creator, or the viral
   moment. This is the part competitors don't have.
3. **Says how people use it** — the edit, the prank, the Discord call.

Not in that order every time. Varying the entry point is the point.

## Facts

**Never invent provenance.** If you don't know which film or year a clip is
from, write about how it's used and how it sounds instead. A blurb with no
origin is fine; a blurb with a wrong origin is a lie that outranks the truth.

When restyling existing copy, facts survive the edit unchanged. The August 2026
rewrite was verified by diffing every file: zero blurbs lost a year or a
frequency.

The `origin` field is separate and factual — one line, no personality required.

## Exclusions

Do not import or write copy for: slurs, sexual or crude-sexual content, drug
references, political figures or politically charged clips, or full-length
copyrighted music. Short game/system/TV stings are fine; complete songs are not.

---

## Workflow for a new batch

```bash
# 1. Validate + cache the audio before writing a word of copy
node scripts/preflight.mjs data/candidates-N.txt

# 2. Write the manifest, using only slugs preflight marked ok/cached
#    (see data/import-batch-7.json — that batch is the quality benchmark)

# 3. Import
node scripts/import-sbl.mjs data/import-batch-N.json

# 4. Audit the copy — this is the step that stops AI drift
node scripts/audit-copy.mjs

# 5. Build
npm run build
```

Step 4 is the one people will skip. Don't.
