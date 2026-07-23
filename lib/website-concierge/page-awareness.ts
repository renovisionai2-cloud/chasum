import type { MarketingPageId, PageContext } from "@/lib/website-concierge/types";

const PAGE_META: Record<
  MarketingPageId,
  { title: string; goals: string[] }
> = {
  home: {
    title: "Home",
    goals: [
      "Discover the visitor's business (consultant-style)",
      "Learn challenges, tools, and goals without interrogating",
      "Recommend personalized Chasum capabilities",
      "Offer a personalized guided tour",
      "Explain what Chasum is when asked",
    ],
  },
  features: {
    title: "Features",
    goals: [
      "Explain platform capabilities",
      "Recommend features by business type",
      "Connect features to outcomes",
    ],
  },
  pricing: {
    title: "Pricing",
    goals: [
      "Explain founding / Private Alpha plans",
      "Recommend a suitable subscription tier",
      "Answer pricing questions honestly",
    ],
  },
  about: {
    title: "About",
    goals: [
      "Explain Chasum's vision",
      "Describe the AI Business Operating System",
      "Clarify Private Alpha posture",
    ],
  },
  contact: {
    title: "Contact",
    goals: [
      "Help before contacting sales",
      "Offer demo / walkthrough booking",
      "Route to Private Alpha apply when appropriate",
    ],
  },
  apply: {
    title: "Apply",
    goals: [
      "Clarify what Private Alpha means",
      "Help visitors complete an application",
      "Set honest expectations",
    ],
  },
  "meet-summer": {
    title: "Meet Summer",
    goals: [
      "Introduce Summer as AI Business Consultant / Assistant",
      "Run Business Discovery conversationally",
      "Personalize recommendations via Knowledge Engine",
      "Explain today vs inside-Chasum vision",
      "Guide toward Private Alpha when ready",
    ],
  },
  general: {
    title: "Marketing",
    goals: [
      "Answer product questions",
      "Guide visitors to the right next step",
    ],
  },
};

/**
 * Map a public marketing pathname to a page-aware context.
 * Intentional: marketing routes only — never used for dashboard/auth.
 */
export function detectMarketingPage(pathname: string): PageContext {
  const path = normalizePath(pathname);

  let pageId: MarketingPageId = "general";
  if (path === "/") pageId = "home";
  else if (path === "/pricing") pageId = "pricing";
  else if (path === "/contact") pageId = "contact";
  else if (path === "/apply") pageId = "apply";
  else if (path === "/meet-summer") pageId = "meet-summer";
  else if (
    path === "/private-alpha" ||
    path === "/roadmap" ||
    path === "/security"
  ) {
    pageId = "about";
  } else if (path.includes("feature")) {
    pageId = "features";
  }

  const meta = PAGE_META[pageId];
  return {
    pageId,
    pathname: path,
    title: meta.title,
    goals: [...meta.goals],
  };
}

export function getPageGreeting(pageId: MarketingPageId): string {
  switch (pageId) {
    case "home":
      return "Welcome — I'm Summer, Chasum's AI Business Assistant. I'd like to understand your business so I can help thoughtfully. What kind of appointment-based business do you run?";
    case "features":
      return "You're looking at how Chasum works. Tell me a bit about your business and I'll point you to what matters most — or ask about a specific capability.";
    case "pricing":
      return "Happy to walk through founding pricing. First — are you a solo operator, multi-location, or evaluating for a team?";
    case "about":
      return "Curious about the vision? I can explain Chasum as an AI Business Operating System — or keep it practical for your business.";
    case "contact":
      return "Before you reach out — I can learn about your business and answer product questions, or help you book a walkthrough. What would help most?";
    case "apply":
      return "Private Alpha is invite-based design partnership. I can clarify fit, expectations, and next steps — what's your business type?";
    case "meet-summer":
      return "Welcome.\n\nI'm Summer — Chasum's AI Business Assistant.\n\nBefore recommending software, I'd like to understand your business.\n\nWhat kind of appointment-based business do you run?";
    default:
      return "Hi — I'm Summer, Chasum's AI Business Assistant. Tell me about your business and I'll help you see if Chasum is a fit.";
  }
}

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const trimmed = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed || "/";
}
