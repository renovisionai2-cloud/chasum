import type {
  BusinessType,
  MarketingPageId,
} from "@/lib/website-concierge/types";

export type KnowledgeArticle = {
  id: string;
  tags: string[];
  pages?: MarketingPageId[];
  businessTypes?: BusinessType[];
  title: string;
  body: string;
};

/**
 * Curated marketing knowledge for Phase 1 placeholder responses.
 * Swap to retrieval / embeddings later without changing the UI.
 */
export const WEBSITE_KNOWLEDGE: KnowledgeArticle[] = [
  {
    id: "what-is-chasum",
    tags: ["overview", "product", "explain", "what"],
    pages: ["home", "about", "general", "features"],
    title: "What Chasum is",
    body:
      "Chasum is an AI Business Operating System for appointment-based service businesses. It unifies scheduling, CRM, employees, communications, reports, and Early Access AI — so you stop duct-taping calendars, spreadsheets, and SMS tools together.",
  },
  {
    id: "vision-bos",
    tags: ["vision", "brain", "operating", "system", "about"],
    pages: ["about", "home", "general"],
    title: "AI Business Operating System vision",
    body:
      "Long-term, Chasum becomes a Business Brain: not just storing data, but understanding revenue shifts, staff performance, best-selling packages, inactive clients, and underbooked days — then putting the right decision on every screen.",
  },
  {
    id: "features-core",
    tags: ["feature", "scheduling", "calendar", "booking", "crm"],
    pages: ["features", "home", "general"],
    title: "Core platform",
    body:
      "Core capabilities include public booking, calendar & reception, client CRM, services & employees, reminders, reporting, and commerce building blocks. Early Access AI includes Summer (reception-style assistance) and Chase (insights) for design partners.",
  },
  {
    id: "features-by-business",
    tags: ["recommend", "business", "industry", "salon", "clinic", "ultrasound"],
    pages: ["home", "features", "general"],
    title: "Feature recommendations",
    body:
      "Ultrasound and clinics usually start with reliable booking, reminders, and CRM notes before a visit. Salons and spas lean on packages, rebooking, and staff schedules. Multi-location operators should look at Business tier capacity and reporting.",
  },
  {
    id: "pricing-overview",
    tags: ["price", "plan", "cost", "subscription", "founding"],
    pages: ["pricing", "home", "general", "contact"],
    title: "Pricing posture",
    body:
      "Founding pricing is for Private Alpha design partners. Public self-serve checkout launches after alpha. Typical published tiers: Free ($0) to explore core scheduling; Professional ($79/mo) with Early Access AI & automation; Business ($149/mo) for more locations & API; Enterprise for custom onboarding.",
  },
  {
    id: "pricing-recommend",
    tags: ["recommend", "which plan", "professional", "business"],
    pages: ["pricing", "general"],
    title: "Plan recommendation guidance",
    body:
      "Solo operators evaluating fit often start Free or Professional. Growing studios that want Summer & Chase plus SMS/automation usually fit Professional. Multi-location teams needing more sites and API access lean Business. Enterprise is for custom SLA and onboarding.",
  },
  {
    id: "private-alpha",
    tags: ["alpha", "apply", "invite", "partner"],
    pages: ["apply", "about", "home", "contact", "general"],
    title: "Private Alpha",
    body:
      "Chasum is in Private Alpha: limited design partners, founder support, and an honest roadmap. Apply via /apply. Partners help shape the product and receive founding customer pricing — not a mass self-serve launch yet.",
  },
  {
    id: "contact-demo",
    tags: ["contact", "demo", "walkthrough", "sales", "tour"],
    pages: ["contact", "home", "general"],
    title: "Contact & walkthrough",
    body:
      "Before emailing sales, I can answer product questions here. To apply for Private Alpha go to /apply. To book a product walkthrough, use the walkthrough CTA on /contact (mailto sales@chasum.app) or ask me to point you there.",
  },
  {
    id: "summer-role",
    tags: ["summer", "concierge", "ai", "assistant"],
    pages: ["home", "about", "features", "general"],
    title: "Who Summer is",
    body:
      "I'm Summer — Chasum's AI website concierge on the marketing site. Inside the product, Summer also appears as Early Access reception-style AI for design partners. This chat uses a knowledge base today; a swappable AI provider will power richer reasoning later without redesigning the UI.",
  },
];

export function searchKnowledge(input: {
  query: string;
  pageId: MarketingPageId;
  businessType: BusinessType;
  limit?: number;
}): KnowledgeArticle[] {
  const { query, pageId, businessType, limit = 3 } = input;
  const tokens = tokenize(query);

  const scored = WEBSITE_KNOWLEDGE.map((article) => {
    let score = 0;
    if (article.pages?.includes(pageId)) score += 3;
    if (
      businessType !== "unknown" &&
      article.businessTypes?.includes(businessType)
    ) {
      score += 2;
    }
    for (const tag of article.tags) {
      if (tokens.some((t) => tag.includes(t) || t.includes(tag))) score += 2;
    }
    const hay = `${article.title} ${article.body}`.toLowerCase();
    for (const t of tokens) {
      if (hay.includes(t)) score += 1;
    }
    return { article, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return WEBSITE_KNOWLEDGE.filter(
      (a) => a.pages?.includes(pageId) || a.id === "what-is-chasum",
    ).slice(0, limit);
  }

  return scored.slice(0, limit).map((s) => s.article);
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}
