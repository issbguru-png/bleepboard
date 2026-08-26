import { SITE, absolute } from './site';

/**
 * JSON-LD builders.
 *
 * Rule for this file: schema describes what is actually on the page. Nothing
 * here invents a number. In particular there is deliberately no
 * AggregateRating, no Review and no `interactionStatistic` — the `plays` field
 * in the sound content is an editorial ordering weight, not a measured play
 * count (see src/content.config.ts), so publishing it as a play count would be
 * a fabricated metric. If real play counts ever exist, add it then.
 */

/** Publisher stub, reused by Article and AudioObject. */
export const publisher = {
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  logo: {
    '@type': 'ImageObject',
    url: absolute(SITE.logo),
  },
};

export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: absolute(SITE.logo),
    },
    image: absolute(SITE.ogImage),
    description: SITE.description,
  };
}

/**
 * WebSite node. `searchUrlTemplate` is optional on purpose: a SearchAction
 * tells Google it can deep-link a query, so it must only be emitted when the
 * site genuinely answers that URL. The homepage reads `?q=` and renders
 * results for it, which is what earns the action here.
 */
export function website(searchUrlTemplate?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: 'en',
    publisher: { '@id': `${SITE.url}/#organization` },
    ...(searchUrlTemplate
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: searchUrlTemplate,
            },
            'query-input': 'required name=search_term_string',
          },
        }
      : {}),
  };
}

/** `crumbs` is [name, absolute url] pairs, ordered from Home outwards. */
export function breadcrumbs(crumbs: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([name, item], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item,
    })),
  };
}

/**
 * An ordered list of things the page actually shows, in the order it shows
 * them. `items` must be the rendered set — not the full corpus — otherwise the
 * list describes a page that does not exist.
 */
export function itemList(
  name: string,
  items: { name: string; url: string }[],
  description?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description ? { description } : {}),
    numberOfItems: items.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}

export function faqPage(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
