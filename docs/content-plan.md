# Content plan

Written 2026-10-22, from Search Console (2026-09-22 to 2026-10-19) and GA4
(last 28 days). Supersedes any earlier plan built on GA pageviews alone, which
got the Spanish question badly wrong. See "What changed my mind" below.

Numbers here go stale. The reasoning is the part worth keeping.

---

## The one-paragraph version

Spanish is the best-ranking thing on this site and had nothing to sell. The
`/es/` hubs sit at positions 5 to 8 where their identical English twins sit at
12 to 43, because "botonera" SERPs are barely contested, and until this week
every one of the 647 clip pages existed in English only. Building Spanish depth
is the highest-return work available. Everything else on this page is second.

---

## What the data actually says

### Brand carries more than it looks

About 63% of all clicks are people typing the name. "bleepboard" alone took
1,339 clicks at position 1.3. For a site this young that is a lot of word of
mouth, and it fits the audience: weekday traffic runs 450 to 580 users and
weekends drop to 80 to 140, which is the school-hours signature. They search
the name instead of bookmarking.

The flip side is that non-brand organic is smaller than GA's headline suggests.
Roughly 1,080 clicks in 28 days.

### Spanish outranks English, consistently

| Spanish | Position | English twin | Position |
|---|---|---|---|
| `/es/animal-soundboard/` (346 impr, 53 clicks) | **6.1** | `/animal-soundboard/` | 21.5 |
| `/es/brainrot-soundboard/` | 5.7 | `/brainrot-soundboard/` | 12.3 |
| `/es/fart-soundboard/` | 5.9 | `/fart-soundboard/` | unranked |
| `/es/discord-soundboard/` | 6.5 | n/a | |
| `/es/tiktok-soundboard/` | 6.8 | `/tiktok-soundboard/` | 21.8 |
| `/es/prank-soundboard/` (229 impr) | 8.1 | `/prank-soundboard/` | |

`/es/animal-soundboard/` was the best non-brand page on the whole site by
clicks. The Spanish head term "botonera de sonidos" ranks 8.7 and takes zero
clicks, because no dedicated page targets it: `/es/` absorbs it.

### "unblocked" is the strongest English asset

One hand-built page, `/unblocked-soundboard/`, pulls 973 impressions and 101
clicks at position 22.4. Second only to the homepage among non-brand pages.
The modifier maps onto hubs that already exist:

meme (14,800/mo) · brainrot (210, difficulty 10) · 67 (170, difficulty 17) ·
goofy ahh (110) · fart (110) · fortnite (40) · minecraft (30)

Head term "soundboard unblocked" is 90,500/mo at difficulty 45, in SERPs full
of Google Sites junk. The winnable money is the difficulty-10-to-28 tail.

### Download intent beats browse intent roughly tenfold

`/sound/iphone-notification/` took 377 views and produced **320 downloads**.
Site-wide the rate is 7.6%. The system-and-notification cluster is the most
commercially valuable content here and has one generic hub.

### The theme hubs are fine, actually

An earlier read of this said the 20 theme hubs were orphaned because only
`/categories/` links to them. Search Console refutes it: `/67-soundboard/` sits
at 6.6, `/notification-soundboard/` at 8.3, `/minecraft-soundboard/` at 7.7.
They rank. Their queries are just small. Internal linking is worth improving,
but it is cleanup, not a gate.

### Google is not the whole picture

| Organic source | Sessions, 28d |
|---|---|
| Google | 4,710 |
| **Bing** | **3,173** |
| Yahoo + DuckDuckGo (Bing-powered) | 135 |

**About 41% of organic comes through a channel Search Console cannot see.**
Everything above describes the Google 59%. Connecting Bing Webmaster Tools is
the single biggest measurement gap left, and nobody here can do it from the
command line.

This is also why `scripts/indexnow.mjs` matters more than it looks. Bing is a
push channel; a new URL that never gets submitted waits for a crawl that may
not come.

---

## Priority order

1. **Spanish depth.** Keep translating complete boards. You hold the rankings
   already and they have nowhere to send anyone.
2. **A dedicated page for "botonera de sonidos".** The head term ranks 8.7 on
   `/es/` by accident. Nothing targets it on purpose.
3. **"unblocked" variants** as a real page type. One page proved the intent at
   101 clicks.
4. **Notification cluster depth**, building on the 85% download rate.
5. **Internal linking** cleanup: themes in the homepage grid, themes in the
   sibling block in `[hub].astro`, sound pages cross-linked to their
   `explainer` posts.
6. **"meme soundboard".** Position ~70 on the most relevant head term, still
   extracting 141 US clicks from people paging that deep. Largest ceiling,
   hardest climb.

### The Spanish backlog, in the order I would take it

| Board | Clips | Spanish position | Note |
|---|---|---|---|
| animal | 18 | 6.1 | done |
| discord | 7 | 6.5 | done |
| prank | 13 | 8.1 | done |
| anime | 13 | 5.0 to 7.4 | done |
| brainrot | 35 | 5.7 | done |
| tiktok | 35 | 6.8 | next |
| spongebob | 20 | no signal | |
| notification | 46 | | pairs with priority 4 |
| sound-effects | 92 | | |
| gaming | 159 | | |
| meme | 209 | | last, and it is a project |

---

## How to add a Spanish batch

A sound opts in by carrying an `es` block in its JSON. That one field is the
whole switch: it builds `/es/sound/{slug}/`, builds the Spanish embed widget,
registers the hreflang pair on both sides, adds the sitemap entry, makes the
Spanish hub show the Spanish name and link to the Spanish page, and puts the
URL in the IndexNow submission. Same contract themes and categories use, so a
clip is either fully bilingual or English only, never half-wired.

```json
"es": {
  "title": "Vaca Mugiendo",
  "origin": "Grabación de campo de una vaca mugiendo.",
  "blurb": "..."
}
```

Rules, enforced by `scripts/audit-copy.mjs`: 70 to 110 words, 200+ characters,
no em dashes anywhere, no duplicate blurbs, no two Spanish blurbs sharing a
four-word opening, and land at least one sentence under 12 words. Voice and
register are in [writing-blurbs.md](writing-blurbs.md). Neutral Latin-American
Spanish, tú and never vosotros, "botonera", "bajar" for download.

### Translate whole boards, not scattered top clips

A half-translated board makes its own prose wrong and splits its links across
two languages. The audit warns when a category or theme is mid-translation.

Themes are the trap. A theme gathers sounds by substring across every category,
so finishing one category leaves a scattering of themes half done. Worse, a
theme can silently *complete*: translating brainrot finished the 67 theme at
11/11 in one go, and a finished board stops warning. **After every batch, grep
the Spanish hub copy for stale language claims**, in themes as well as
categories. The guard catches drift, not completion.

### What still needs doing per batch

After writing the blurbs, check the hub intros of every affected board, in both
collections, for sentences claiming the clip pages are in English. Then
`npm run audit -- --all` and `npm run build`.

---

## What not to chase

On-site search surfaces real demand the site will not serve: "moan" and
"diddy" both appear. Excluded by the rules in
[writing-blurbs.md](writing-blurbs.md), deliberately.

A third language is a hint, not yet a case. German and Portuguese queries turn
up in on-site search and Brazil is the third country by users, but at 115 users
that is a long way short of justifying another `/pt/` tree.

Do not chase "soundboard unblocked" itself. Difficulty 45, and the SERP belongs
to free-hosting junk that outranks real sites on that term specifically.
