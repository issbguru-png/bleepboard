import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const sounds = await getCollection('sounds');
  const index = sounds.map((s) => ({
    slug: s.id,
    title: s.data.title,
    tags: s.data.tags,
    category: s.data.category,
    audio: s.data.audio,
    duration: s.data.duration,
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
