# Getting the first links

Written 2026-08-27. Bleepboard has **0 backlinks from 0 referring domains**. That
is not a rounding error or a reporting lag — the crawl returns nothing, because
nothing has ever pointed here.

Everything else is finished. 600 sounds with hand-written origin copy, 11 hubs,
13 articles, clean markup, fast pages, a sitemap submitted to Search Console.
None of it can rank without links, so this is the only remaining lever.

This document is the research and the scripts. **The sending is yours.** Nobody
can outsource the part where a real person emails another real person, and any
tool that claims to is selling you a footprint that Google already recognises.

---

## 1. What actually earns links in this niche

Rather than guess, I pulled the live referring pages for four soundboard sites
and read them. The pattern is not what you would expect from an SEO checklist,
and it changes what is worth your time.

**The single most common real link is a writer needing the reader to hear one
specific sound, mid-sentence.** Not a review of the site. Not a directory
listing. A journalist writes about a meme, wants to let you play it, and links
the page for that one clip.

Actual examples, all live:

| Linking page | Links to | Anchor |
|---|---|---|
| Forbes, on the Forza Horizon 6 horn (Jun 2026) | myinstants `/grunt-birthday-party/` | "grunt birthday party" |
| Hollywood Reporter, ranking Nolan films | myinstants `/inception-button/` | "bwaaaaahm" |
| Mashable, on a Slack ad | 101soundboards `/knock-brush` | "knock brush" |
| BuzzFeed and G1 Globo, World Cup meme roundups | myinstants, deep sound pages | "aqui", "e o oeaaaaaa" |
| LatestLY, on a viral Instagram audio | instantsoundboard `/technologia-meme-sound` | "here's how you can download…" |
| Goodreads, a book's description page | myinstants `/dun-dun-dunnnnnnnn/` | "dun dun dunnnnnnn" |

Note the anchors. Nobody writes "best free soundboard". They write the name of
the sound, because that is what the sentence needed. Deep pages, natural
phrasing, no negotiation involved.

The second cluster is **reference works**:

| Linking page | Links to |
|---|---|
| en.wikipedia.org/wiki/Metro_Boomin | myinstants, "make it boom sound button" |
| pt.wikipedia.org/wiki/Leeroy_Jenkins | myinstants, "botão leeroy jenkins" |
| ru.wikipedia.org/wiki/Гачимучи | 101soundboards |
| en.wikipedia.org/wiki/Bad_Cats (a pinball table) | 101soundboards |
| soundeffects.fandom.com/wiki/Wilhelm_Scream | myinstants |
| military-history.fandom.com/wiki/Bob_Ross | 101soundboards |

All nofollow. Take them anyway — they send curious, on-topic visitors, they are
the kind of citation a human ad-network reviewer likes seeing, and Google has
treated `nofollow` as a hint rather than an instruction since 2019.

Third, smaller but easy: **podcast show notes** (Software Defined Talk linking a
SpongeBob sting; a Spotify creators episode page linking 101soundboards),
**awesome-lists on GitHub**, and **how-to posts about routing audio into a call**
— one Medium piece on getting sound into Clubhouse linked myinstants with the
anchor "free soundboard".

### What this means for you

Three things follow, and they are the whole strategy.

1. **The unit of outreach is one sound, not the site.** Pitching "check out my
   soundboard" has no natural home in anyone's article. Pitching "the clip you
   described in paragraph four is here, with where it came from" does.
2. **Your per-sound origin writing is the actual product here.** A writer
   choosing between four soundboards will link the one whose page tells them the
   clip is from a 2014 Vine and who made it, because that page is the one they
   can cite in the sentence they are already writing.
3. **Speed matters more than polish.** The Forbes link happened eight days after
   the game shipped. Meme coverage is written in a two-week window and then never
   again.

---

## 2. What will not work

**Buying links.** Two near-peer sites show exactly where that road ends.
`instantsoundboard.com` has 74 referring domains; `memesoundboard.net` has 52.
Sorted by authority, almost every one is the same scraped page template —
"🏆 Boost your Google rankings with Premium PBN & Link Building" — spread across
throwaway domains (`juaralaundry.com`, `casinooftheking.com`, `cmocheatsheets.com`)
with an identical 25-word keyword-stuffed anchor, most of them first seen inside
the same fortnight of August 2026. Neither site ranks. They have paid for a
footprint so obvious you can spot it by eye in a table.

Bleepboard is being prepared for ad-network review. Mediavine and AdSense both
look at link profiles. One PBN burst is worth less than nothing here.

**Also skip:**

- Directory blasts and "submit to 500 sites". Same footprint, same result.
- Comment links. Nofollowed, removed, and they make people dislike you.
- Guest-post marketplaces. Google has been de-indexing those networks in waves.
- Reciprocal link swaps with other soundboards. Your competitors are not going
  to send you their traffic, and a mutual-link cluster is easy to detect.
- Any tool promising automated outreach. The reply rate is zero and the sender
  domain gets burned.

**Manage your expectations on these, too:** paid press-release wire services
(syndicated copies, no editorial value), Web 2.0 profiles (Medium, Tumblr, about.me
— fine to own, worth nothing as links), and infographic seeding (nobody has wanted
one since 2016).

---

## 3. What Bleepboard actually has to link to

Be honest with yourself here, because the pitch has to be true.

**Strong:**

- **Per-sound origin writing.** Six hundred pages that say where a clip came
  from, in sentences a human wrote. This is the thing competitors do not have and
  the reason a writer would cite you specifically.
- **Free MP3 download on every page**, no signup, no email wall. The LatestLY
  link above exists purely because someone wanted a download.
- **The explainer articles.** `/blog/what-does-67-mean/`,
  `/blog/italian-brainrot-explained/`, `/blog/skibidi-toilet-explained/` and the
  rest are linkable in their own right — a journalist covering a new brainrot
  term needs a definition to point at.
- **The unblocked angle.** `/unblocked-soundboard/` speaks to school and library
  networks. Teacher and student resource pages are a real, under-worked category.

**Weak, whatever it feels like:**

- "We have 600 sounds." So does everyone. Volume is not a story.
- "It's free." Every competitor is free.
- The site being new. Nobody links to a launch.

---

## 4. The channels, in the order worth doing them

### 4.1 Sound-citation outreach — highest value, most work

This is the Forbes/Mashable pattern, run deliberately instead of waiting for it.

**The loop:**

1. Set Google Alerts, and a saved X/Twitter search, for the meme names you
   already have pages for. `scripts/trend-monitor.mjs` already watches trends —
   use the same list.
2. When a piece publishes that describes a sound without linking anywhere you can
   hear it, find the writer's email (usually on their author page, or
   `firstname.lastname@publication`).
3. Send template A within 72 hours. After a week it is dead.

**Realistic reply rate: 1 in 15 to 1 in 25.** Most will ignore you. Some will add
the link without replying, so check the page again a fortnight later rather than
assuming silence means no.

### 4.2 Wikipedia and Fandom

Six of the highest-authority links across both big competitors are Wikipedia
external links, in five languages. The article about a meme or a character
frequently has an External links section, and "hear the sound" is a legitimate
entry there.

**This one will bite you if you rush it.** A brand-new account adding a link to
its own site is spotted immediately, reverted, and the domain can end up on the
spam blacklist — which is much worse than having no link. So:

- Make an account and spend a month doing unrelated, useful edits first. Fix
  typos, add citations, revert vandalism. Fifty edits is a reasonable floor.
- Disclose the connection on your user page. Wikipedia's conflict-of-interest
  rules do not forbid the link; they forbid hiding who you are.
- For anything you are connected to, propose the edit on the article's Talk page
  and let someone else make it. Slower, and it survives.
- Fandom wikis (soundeffects.fandom.com, the game and cartoon wikis) are far more
  relaxed. Start there. Same principle, lower stakes.

Expect 2–4 links from this over three months, and count the month of unrelated
editing as part of the cost.

### 4.3 Podcast and stream show notes

Podcasters use these clips constantly and half of them credit the source in the
notes. Small audiences, easy yes.

Search for podcasts that have used a sting you host, or simply approach the
small-to-mid comedy and gaming shows in your niche and offer the specific clips
they keep reaching for. Template C.

### 4.4 Reddit and Discord

**Read this part before posting anything.**

These communities are where your audience actually is, and they are also where
self-promotion gets you banned in under an hour. `r/InternetIsBeautiful`,
`r/discordapp`, `r/Twitch`, `r/memes`, `r/streaming` all have explicit rules and
active moderators. A burned account cannot be un-burned, and mods talk.

What works:

- **Be a member for months before you ever link.** Comment, answer things, build
  a history. If your account's first post is your own site, it is removed.
- **Answer the question that was asked.** Somebody asks where to find the Vine
  Boom for their Discord soundboard: link the page, mention it's a free MP3, and
  say it's your site. Volunteered disclosure is what stops it reading as spam.
- **Message the mods first** for anything that looks like a launch post. Some
  subreddits allow it on a specific day; some will say no, which saves you a ban.

Direct SEO value is roughly zero — Reddit nofollows outbound links and Discord is
invisible to crawlers. Do it for the traffic, the feedback, and because a sound
that gets shared in a Discord is a sound somebody later writes about.

### 4.5 Roundups, tool lists and resource pages

Lower yield than the categories above, but self-serve and you can work through
them on a wet afternoon.

- **"Best soundboard for Discord/Twitch/OBS" listicles.** Search the phrase, take
  the first three pages of results, and pitch template D. Most will not answer.
  Some run on affiliate revenue and want payment — decline; paid placements in
  those lists are exactly the thing an ad-network reviewer flags.
- **Broken-link building.** Many of these lists cite soundboards that are dead
  (Instaud.io, several Flash-era boards). Find a dead entry, tell them, offer the
  replacement. Highest acceptance rate of anything in this section, because you
  are fixing their page rather than asking for a favour.
- **Teacher and classroom resource pages.** Drama teachers, ESL listening
  activities, school-radio clubs. The `/unblocked-soundboard/` page is the honest
  hook, and `.edu` and `.ac.uk` links are hard to get any other way. Template E.
- **GitHub awesome-lists.** `awesome-telegram` links myinstants. Find the
  awesome-lists for Discord bots, OBS tooling and streaming resources, and open a
  pull request. Nofollowed, but instant and free.

### 4.6 HARO-style sourcing

Qwoted, Featured, SourceBottle and the rest. Requests about memes, internet
culture, Gen Alpha slang and streaming setups come up more often than you would
think, and you can answer them with something nobody else can: what a clip
actually is and where it came from.

**Honest assessment:** you will answer 30 queries for 1–2 published mentions, and
some publications credit you without a link. Worth twenty minutes a week, not
worth an hour a day.

### 4.7 The embed play

`/embed/` is polished now (see section 6) and it costs nothing to keep. But it
should not be the plan, and I want to be direct about why.

Across roughly forty real referring pages I read for four competitors, **not one
was an embed credit link.** Not a single one. The mechanism is real in principle
and there is no evidence of it working in this niche at any scale.

Three reasons it underperforms:

- Links inside an iframe belong to the framed document, not to the host page.
  Only the visible credit line beneath the iframe is a backlink at all — and it
  is the first thing people delete.
- Embeds spread from traffic. A site nobody visits has nobody to embed it. This
  is a channel that gets good *after* the others work, not instead of them.
- The people most likely to embed a sound button are streamers and Discord
  server owners, and neither of those surfaces is crawlable.

Keep it, mention it when it fits, and expect the first embed link some time after
the first thousand sessions a month. Judge it by referral traffic in GA4, not by
referring domains.

---

## 5. Templates

Short, specific, no throat-clearing. Delete anything that sounds like a mail
merge. If you would not send it to someone you know, do not send it.

### A — writer who just covered a sound

> **Subject:** the [sound name] clip in your [topic] piece
>
> Hi [name],
>
> Your piece on [specific thing, showing you read it] — you describe the
> [sound name] but there's nowhere in the article to actually hear it.
>
> We have it here if it's useful: [URL]. Plays in one click, free MP3 under it,
> and the page says where the clip is originally from ([the actual origin fact]),
> which I couldn't find written down anywhere else.
>
> No obligation either way. Thought it might save your readers a search.
>
> [name], bleepboard.com

Note what this does: it proves you read the piece, it names the exact gap, and
the offer is a fact they can verify. Cut the origin line if you do not have a
real one for that sound — an invented provenance is worse than no email.

### B — Wikipedia / Fandom talk page

> The External links section doesn't currently have anywhere to hear the sound
> itself. bleepboard.com/sound/[slug]/ has the clip with a short sourced note on
> its origin. Disclosure: I run that site, so I'm not going to add it myself —
> flagging it here in case an editor thinks it belongs.

### C — podcast or streamer

> **Subject:** the [sound] you use
>
> Hi [name],
>
> You use the [sound name] most weeks on [show] — it's at [URL] as a free MP3 if
> you ever want a clean copy, and there's a one-click embed if you credit sounds
> in your notes.
>
> Either way, the download's free and there's no signup. Long-time listener.
>
> [name]

### D — roundup with a dead link

> **Subject:** dead link in your [year] soundboard roundup
>
> Hi [name],
>
> [dead site] in your [article title] has been offline since [date] — entry
> [number] on the list.
>
> If you want a replacement, bleepboard.com is free, needs no signup, and every
> sound has a written note on where it came from. No hard feelings if it's not a
> fit; the dead link's worth fixing regardless.
>
> [name]

### E — teacher or school resource page

> **Subject:** free sound effects for [class / club]
>
> Hi [name],
>
> Your [resources page] lists audio tools for [drama / ESL / radio club]. We run
> bleepboard.com — free sound effects and meme clips, no account, no ads at the
> moment, and everything downloads as an MP3 so it works offline.
>
> There's a page at bleepboard.com/unblocked-soundboard/ that works on the
> filtered networks most schools run, which is usually the sticking point.
>
> Add it if it's useful to your students.
>
> [name]

---

## 6. What changed on the site to support this

- `/embed/[slug]/` was rebuilt. It now carries a clickable title linking to the
  sound's page and a wordmark linking to the homepage, both `rel="noopener"` and
  neither nofollowed. It loads no audio until somebody presses play — the old
  version pulled the MP3 down on every view of the host page, which made it a
  liability to embed.
- The embed section on every sound page now shows a live preview of the widget
  above the code, and the snippet includes the credit link with a plain-English
  note asking people to keep it.
- The snippet is fluid down to phone width and survives a CMS stripping the
  `style` attribute.

Two things still worth doing that are outside this document's remit:

- **A `/embed/` landing page** explaining the widget, with a picker. There is
  currently no way to find the embed feature except by visiting a sound page.
- **Deciding whether `rel="nofollow"` belongs anywhere.** It doesn't currently.
  That's correct — leave it.

---

## 7. How long the first 20 links take

Blunt version: **four to six months at three to five hours a week**, and the two
halves are nothing alike.

**Links 1–8 — roughly six weeks.** These are the ones you can get without anyone
saying yes: GitHub awesome-list pull requests, a couple of legitimate free
directories, Fandom wiki entries, your own profiles on Product Hunt / Indie
Hackers / X / GitHub, one or two podcast show notes, a broken-link fix that lands.
Low authority, mostly nofollow, and they are worth having anyway because a profile
with zero referring domains looks abandoned to everything that inspects it.

**Links 9–20 — three to five more months.** These need a human decision. At a
1-in-20 reply rate, twelve links is roughly 250 well-targeted emails, which is
about fifteen a week for four months. Wikipedia adds its own month of unrelated
editing before you touch anything.

Of the 20, expect maybe 6–8 dofollow and 2–3 that move rankings on their own. The
rest matter as a pattern — a profile that looks like a real site being cited by
real people is what gets you out of the sandbox, and no single link does that.

**One accelerant, and it is worth more than any of the above:** if a sound you
host goes viral while you are the best-written page for it, you can pick up more
links in a fortnight than in the preceding six months. That is what the trend
monitor is for. Ship pages fast when something breaks, then pitch the writers
covering it the same week.

**What to expect at 20 referring domains:** hub pages competing on the second
page for mid-tail terms, and individual sound pages ranking for their own names.
Not the homepage on "meme soundboard" — that costs several hundred domains and
is not a realistic target this year.

---

## 8. Keeping track

Make a spreadsheet before you send anything. It matters more than it sounds.

| Column | Why |
|---|---|
| Target URL | Stops you pitching the same page twice |
| Contact + how you found it | So a follow-up isn't a cold start |
| Date sent | Follow up once at day 10, then never again |
| Angle used | Tells you which template earns replies |
| Outcome | Live / declined / silent |

Check reality monthly rather than daily. Search Console's Links report is the
truth; third-party crawlers lag by weeks and will tell you nothing has happened
when something has.

Two rules that protect the ad-network application:

- **Never pay for a link.** Not a listicle slot, not a "sponsored review", not a
  guest post placement fee.
- **Never send the same email twice in a week.** Volume is what turns outreach
  into spam, and spam complaints follow the domain, not the campaign.

---

## Related

- [docs/writing-blurbs.md](writing-blurbs.md) — the copy SOP. The per-sound
  writing is the asset every pitch above rests on.
- `scripts/trend-monitor.mjs` — the trend watcher, and the source of your
  citation-outreach queue.
