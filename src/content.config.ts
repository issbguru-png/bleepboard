import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const sounds = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/sounds' }),
  schema: z.object({
    title: z.string(),
    category: z.string(), // category slug
    tags: z.array(z.string()).default([]),
    duration: z.number(), // seconds
    audio: z.string(), // /audio/{slug}.mp3
    blurb: z.string().min(200), // unique copy — quality gate: ~60-120 words
    origin: z.string().optional(), // one-liner on where the sound comes from
    explainer: z.string().optional(), // path to a blog explainer, e.g. /blog/vine-boom-history/
    added: z.coerce.date(),
    featured: z.boolean().default(false),
    /** Editorial popularity weight used for ordering. NOT a measured play
     *  count — nothing counts plays (see docs). Never display as "plays". */
    plays: z.number().default(0),
    /** Who supplied this clip: a contributor id from src/content/contributors.
     *
     *  Required, and deliberately so. Every clip on the site is attributable
     *  to someone, and the honest answer for the launch catalogue is the
     *  editorial account rather than an invented person. Submissions that
     *  come in through /upload/ carry the submitter id instead.
     *
     *  This is a provenance record, not decoration: it is what a takedown
     *  notice is answered with, and what decides whether a clip was stored at
     *  the direction of a user. Never fill it in with a name that did not
     *  actually supply the file. */
    contributor: z.string().default('bleepboard'),
    /** What the submitter said about where they got it, kept verbatim. Only
     *  meaningful on user submissions; the editorial catalogue uses `origin`. */
    sourceNote: z.string().optional(),
    /** Whether the MP3 download button is offered.
     *
     *  False on clips owned by a studio or a label. Google's ads policy names
     *  "downloading of copyrighted content" specifically, and distributing a
     *  file is a materially different act from letting somebody press play on
     *  a few seconds of it. Turning the button off keeps the page, its copy
     *  and its ranking while dropping the part that is actually a problem.
     *
     *  Set by scripts/fix-rights.mjs from the tiering in audit-rights.mjs.
     *  Anything genuinely ours stays downloadable, which is most of the site. */
    downloadable: z.boolean().default(true),
    /** Spanish clip page. Presence of this block is the whole opt-in, exactly
     *  as on themes and categories: it renders /es/sound/{slug}/, registers
     *  the hreflang pair on both sides and adds the Spanish URL to the
     *  sitemap. A sound is therefore either fully bilingual or English only,
     *  never half-wired. `title` is the Spanish display name; the audio, the
     *  slug and the tags are shared with the English page. */
    es: z
      .object({
        title: z.string(),
        blurb: z.string().min(200),
        origin: z.string().optional(),
      })
      .optional(),
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/categories' }),
  schema: z.object({
    name: z.string(), // "Meme"
    hubTitle: z.string(), // "Meme Soundboard"
    metaDescription: z.string().max(160),
    intro: z.string().min(400), // ~250 words unique intro
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
    order: z.number().default(99),
    /** Spanish page content — same contract as on themes: presence of this
     *  block is the single switch that wires the /es/ route, the hreflang
     *  pair and the sitemap entry. */
    es: z
      .object({
        name: z.string(),
        hubTitle: z.string(),
        metaDescription: z.string().max(160),
        intro: z.string().min(400),
        faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
      })
      .optional(),
  }),
});

/* Themed hubs.
 *
 * Separate from `categories` on purpose. A sound belongs to exactly one
 * category, which is what makes the category grid coherent — but the queries
 * people actually type cut across that. "fnaf soundboard" wants clips filed
 * under gaming AND sound-effects; "goofy ahh soundboard" wants meme, brainrot
 * and spongebob at once. Forcing those into the category system would mean
 * re-filing sounds and breaking the grid to serve a keyword.
 *
 * So a theme gathers sounds by matching slug, title or tag, and nothing has to
 * move. Themes render at the same /{slug}-soundboard/ URL as categories, so
 * slugs must not collide with a category id.
 */
const themes = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/themes' }),
  schema: z.object({
    name: z.string(),
    hubTitle: z.string(),
    metaDescription: z.string().max(160),
    intro: z.string().min(400),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    /** Substrings matched against a sound's slug, title and tags. */
    match: z.array(z.string()).min(1),
    /** Reuses a CategoryIcon key so themes get artwork without new assets. */
    icon: z.string().default('meme'),
    order: z.number().default(99),
    /** Spanish page content. When present, /es/{slug}-soundboard/ renders,
     *  the hreflang pair is emitted on both sides, and the Spanish URL joins
     *  the sitemap — all keyed off this one field, so a theme is either fully
     *  bilingual or fully English, never half-wired. */
    es: z
      .object({
        name: z.string(),
        hubTitle: z.string(),
        metaDescription: z.string().max(160),
        intro: z.string().min(400),
        faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
      })
      .optional(),
  }),
});

/* Contributors.
 *
 * A contributor is whoever actually supplied a clip. Two kinds exist:
 *
 *   - `bleepboard`, the editorial account, covering the launch catalogue that
 *     the site team researched, cut and wrote the copy for;
 *   - real people, created only when a submission through /upload/ is accepted.
 *
 * There is no third kind. Inventing contributors to make a curated catalogue
 * look user-supplied would misstate provenance on the exact record a takedown
 * notice is answered with, so review-submission.mjs will not create one
 * without a submission file behind it.
 */
const contributors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/contributors' }),
  schema: z.object({
    /** Public display name, as the contributor gave it. */
    name: z.string().min(2).max(40),
    /** One line shown on their page and under their clips. */
    bio: z.string().max(240).optional(),
    /** The in-house account. Renders as a site account, not as a community
     *  member, because it is not one. */
    editorial: z.boolean().default(false),
    joined: z.coerce.date(),
    /** A link they asked to be credited with. */
    link: z.string().url().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    /** Optional shorter <title> for search results, when the editorial
     *  headline is longer than the ~60 characters Google will show. The <h1>
     *  always uses `title`, so the page keeps its real headline. */
    seoTitle: z.string().max(60).optional(),
    description: z.string().max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Per-article artwork, 1200x630, generated by scripts/gen-blog-heroes.mjs
     *  into public/blog/{slug}.png. One image does three jobs: the hero on the
     *  article, the thumbnail on /blog/, and og:image when the link is shared.
     *
     *  Optional on purpose. A required field would fail the build the moment
     *  someone drafts a post before running the generator; instead the article
     *  simply renders without a hero and og:image falls back to the sitewide
     *  card in public/og-image.png. The generator warns about any article it
     *  has no artwork for, which is the right place for that complaint. */
    image: z.string().optional(),
    /** Alt text for `image`. Describes the abstract artwork, not the article —
     *  the headline is already adjacent, so repeating it here is noise. */
    imageAlt: z.string().optional(),
    /** Questions this article answers outright, rendered as a Q&A block and
     *  emitted as FAQPage schema.
     *
     *  Added because Search Console showed the clearest kind of failure:
     *  "verity is from minecraft" at position 10.7 on 100 impressions and
     *  "verity belongs to minecraft" at 9.7 on 42, both earning zero clicks.
     *  We ranked page one for a question and answered it with an essay, so
     *  the click went to whoever answered it in their title. A Q&A block
     *  puts the answer where the searcher can see it before clicking, and
     *  the schema makes it eligible for the expandable result. */
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

export const collections = {
  themes, sounds, categories, blog, contributors };
