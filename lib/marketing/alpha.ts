/**
 * Private Alpha marketing — single source for honest CTAs and destinations.
 * Prefer these over /signup for public acquisition during alpha.
 */

export const APPLY_HREF = "/apply";
export const MEET_SUMMER_HREF = "/meet-summer";
export const PLATFORM_HREF = "/platform";
export const PRODUCT_TOUR_HREF = "/product-tour";
export const INDUSTRIES_HREF = "/industries";
export const PRICING_HREF = "/pricing";
export const PRIVATE_ALPHA_HREF = "/private-alpha";
export const ROADMAP_HREF = "/roadmap";
export const CONTACT_HREF = "/contact";
export const STATUS_HREF = "/status";
export const SECURITY_HREF = "/security";
export const PRIVACY_HREF = "/privacy";
export const TERMS_HREF = "/terms";
export const LOGIN_HREF = "/login";
/** @deprecated Prefer PRODUCT_TOUR_HREF — kept for import compatibility. */
export const HOW_IT_WORKS_HREF = PRODUCT_TOUR_HREF;

/** Primary acquisition CTA */
export const CTA_APPLY_LABEL = "Apply for Private Alpha";

/**
 * @deprecated Use CTA_APPLY_LABEL — kept temporarily for import compatibility.
 */
export const CTA_EARLY_ACCESS_LABEL = CTA_APPLY_LABEL;

/** Meet Summer — flagship AI introduction (nav / dedicated page) */
export const CTA_MEET_SUMMER_LABEL = "Meet Summer";

/** Homepage journey CTA — curiosity before explanation */
export const CTA_START_WITH_SUMMER_LABEL = "Start with Summer";

/** Sales conversation CTA */
export const CTA_DEMO_LABEL = "Schedule a Demo";

/** Prefer contact walkthrough path; mailto remains fallback only */
export const DEMO_HREF = `${CONTACT_HREF}#walkthrough`;

export const DEMO_MAILTO_FALLBACK =
  "mailto:sales@chasum.app?subject=Chasum%20Private%20Alpha%20Walkthrough";

export const CTA_LOGIN_LABEL = "Log in";

export const CTA_DISCUSS_SETUP_LABEL = "Discuss your setup";

export const ALPHA_BANNER =
  "Built with real service businesses. Available to a limited number of design partners.";

export const FOUNDER_PRICING_NOTE =
  "During Private Alpha, we confirm your plan and pricing together. Online self-serve billing isn’t open yet.";

export const LEGAL_ALPHA_NOTICE =
  "Private Alpha legal pages are provided for transparency and will be finalized with counsel before broader launch.";
