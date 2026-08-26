/**
 * Monetisation config — the single source of truth.
 *
 * Everything here is OFF until an ID is filled in. Each integration checks its
 * own ID before emitting a script tag, so a half-configured site ships nothing
 * broken and no empty ad frames.
 *
 * ── WHAT YOU NEED TO FILL IN ────────────────────────────────────────────────
 *   GA4_ID          Google Analytics 4 measurement ID, "G-XXXXXXXXXX"
 *   ADSENSE_ID      AdSense publisher ID, "ca-pub-0000000000000000"
 *   MEDIAVINE_ID    Mediavine site ID (they give you this at launch)
 *   PUBLISHER_DOMAIN Used in public/ads.txt — must match your AdSense account
 *
 * ── IMPORTANT: ADSENSE AND MEDIAVINE ARE NORMALLY MUTUALLY EXCLUSIVE ────────
 * Mediavine is full-service ad management — it takes over the ad slots and
 * generally requires exclusivity on the inventory it runs. Serving raw AdSense
 * units alongside it usually breaches their terms. Pick one:
 *
 *   AD_NETWORK = 'adsense'    → self-managed, no traffic minimum, you own the CMP
 *   AD_NETWORK = 'mediavine'  → full-service, higher RPM, ships its own CMP,
 *                               but has a traffic floor (Journey tier ~10k
 *                               sessions/mo, main programme far higher)
 *   AD_NETWORK = 'none'       → nothing loads
 *
 * Set both IDs if you like; only AD_NETWORK decides what actually runs.
 */

export type AdNetwork = 'none' | 'adsense' | 'mediavine';

/** Which ad network is live. Change this one line to switch. */
export const AD_NETWORK: AdNetwork = 'none';

/** Google Analytics 4. Empty string = not loaded. */
export const GA4_ID = 'G-RE0Q1R4421';

/** AdSense publisher ID. Empty string = not loaded. */
export const ADSENSE_ID = ''; // TODO: 'ca-pub-0000000000000000'

/** Mediavine site ID. Empty string = not loaded. */
export const MEDIAVINE_ID = ''; // TODO: from your Mediavine dashboard

/**
 * Google Funding Choices / Privacy & Messaging is Google's own CMP. It is
 * IAB TCF certified, free, and the practical choice if you run AdSense.
 * You still have to create the message in the AdSense UI; this only loads it.
 * Uses ADSENSE_ID, so no extra value needed — just switch it on.
 */
export const USE_GOOGLE_CMP = false;

/**
 * COPPA / child-directed treatment.
 *
 * This catalogue is Roblox, FNAF, SpongeBob and Minecraft audio. COPPA turns on
 * who the audience actually IS, not how you classify the site. If a meaningful
 * share of visitors are under 13, tagging the site child-directed is the safer
 * call — it disables personalised ads and lowers RPM, but the alternative is
 * regulatory exposure. Worth taking advice rather than guessing.
 *
 * true  → sends tagForChildDirectedTreatment, non-personalised ads only
 * false → standard treatment
 *
 * DECISION (owner, 2026-08-26): false — standard treatment.
 * This was chosen deliberately, not left at a default.
 *
 * Worth revisiting if GA4 audience data later shows the visitor base skewing
 * heavily under 13, since COPPA attaches to who the audience actually is
 * rather than how the site is classified. The switch is this one line.
 */
export const CHILD_DIRECTED = false;

/** Derived flags — don't edit these. */
export const ADS_LIVE = AD_NETWORK !== 'none';
export const ANALYTICS_LIVE = GA4_ID !== '';
export const ADSENSE_LIVE = AD_NETWORK === 'adsense' && ADSENSE_ID !== '';
export const MEDIAVINE_LIVE = AD_NETWORK === 'mediavine' && MEDIAVINE_ID !== '';

/** Anything that sets a cookie or an ad identifier is live. Drives the policy. */
export const TRACKING_LIVE = ADS_LIVE || ANALYTICS_LIVE;

/** Date the privacy policy last materially changed. */
export const POLICY_EFFECTIVE = '2026-08-26';
