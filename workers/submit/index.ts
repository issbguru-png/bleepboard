/**
 * The submissions Worker.
 *
 * Runs at https://bleepboard-submit.<subdomain>.workers.dev and is deliberately
 * NOT a Pages Function. A Worker does not require bleepboard.com to be on
 * Cloudflare, so the site can stay on GitHub Pages and still take uploads.
 * That removes the hosting migration from the critical path entirely; it was
 * the reason /submit/ had nothing behind it.
 *
 * The cost of that choice is being cross-origin, so CORS is handled here. The
 * allowlist is explicit rather than "*": this endpoint writes to storage, and
 * an open one would let any page on the internet fill the review queue.
 *
 * Deploy:
 *   wrangler deploy --config workers/submit/wrangler.toml
 */
import { handleSubmit, type Env } from './handler';

const ALLOWED = new Set([
  'https://bleepboard.com',
  'https://www.bleepboard.com',
  'http://localhost:4321',
]);

function cors(origin: string | null): Record<string, string> {
  // Echo the origin only when it is one of ours. An origin we do not recognise
  // gets no CORS header at all, and the browser refuses the response.
  if (!origin || !ALLOWED.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const headers = cors(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST') {
      return new Response('POST a submission to this endpoint.', { status: 405, headers });
    }

    const res = await handleSubmit(request, env);
    // handleSubmit knows nothing about transport, so the CORS headers go on here.
    const out = new Headers(res.headers);
    for (const [k, v] of Object.entries(headers)) out.set(k, v);
    return new Response(res.body, { status: res.status, headers: out });
  },
};
