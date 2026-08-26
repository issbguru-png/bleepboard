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
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { sounds, categories, blog };
