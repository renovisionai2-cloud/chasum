/**
 * Meet Summer — premium marketing story copy (Phase 5).
 * Narrative-first; Private Alpha apply remains the final chapter only.
 */

export const MEET_SUMMER_PROMPTS = [
  "I run an ultrasound clinic",
  "We use Picktime",
  "Our biggest issue is reporting",
  "How is Chasum different?",
] as const;

export const MEET_SUMMER_HERO = {
  brand: "Meet Summer",
  headline: "Your AI Business Assistant.",
  lines: [
    "Not a chatbot.",
    "Not live support.",
    "Business intelligence that understands your company.",
  ],
  lede:
    "You're meeting the intelligence layer of Chasum — an AI Business Operating System built to understand businesses, not menus.",
} as const;

export const MEET_SUMMER_FIRST_IMPRESSION = {
  eyebrow: "First impression",
  headline: "What you should feel in the first ten seconds.",
  points: [
    "Chasum is an AI Business Operating System.",
    "Summer is not a support chatbot.",
    "Summer understands businesses.",
    "Summer helps owners make better decisions.",
    "Chasum is built around intelligence, not menus.",
  ],
} as const;

export const MEET_SUMMER_PROBLEM = {
  eyebrow: "The Problem",
  headline: "Traditional software stores information.",
  accent: "Summer understands it.",
  body:
    "Calendars, CRMs, and chat tools keep rows. What service businesses lack is something that turns those rows into judgment — what to do next for this company.",
} as const;

export const MEET_SUMMER_THINKS = {
  eyebrow: "How Summer Thinks",
  headline: "From customers to decisions.",
  body:
    "Summer connects the operating graph — not as separate tools, but as one chain of understanding.",
  chain: [
    { id: "customers", label: "Customers" },
    { id: "appointments", label: "Appointments" },
    { id: "employees", label: "Employees" },
    { id: "revenue", label: "Revenue" },
    { id: "decisions", label: "Business Decisions" },
  ],
} as const;

export const MEET_SUMMER_MEMORY = {
  eyebrow: "Business Memory",
  headline: "She learns with your business.",
  body:
    "Every season compounds. Summer is built toward memory that deepens — patterns, relationships, and priorities that a chatbot never keeps.",
  stages: [
    {
      title: "Session",
      detail: "Remembers this conversation — who you are and what you asked.",
    },
    {
      title: "Context",
      detail: "Connects customers, bookings, and staff to the question at hand.",
    },
    {
      title: "Patterns",
      detail: "Sees trends across the calendar — quiet days, loyal clients, risk.",
    },
    {
      title: "Judgment",
      detail: "Recommends the next action: who to call, what to fill, what to watch.",
    },
  ],
} as const;

export const MEET_SUMMER_OS = {
  eyebrow: "AI Business Operating System",
  headline: "One brain. Many roles.",
  body:
    "Chasum is not another scheduling platform. It is the operating system where Summer — and the assistants that follow — share one Business Brain across every department.",
  roles: [
    "AI Reception",
    "CRM Intelligence",
    "Scheduling Assist",
    "Billing Assist",
    "Marketing Intelligence",
    "Reporting Assist",
    "Executive Advisor",
  ],
} as const;

export const MEET_SUMMER_INTERACTIVE = {
  eyebrow: "Experience Summer",
  headline: "Talk with her now.",
  body:
    "This is a live conversation powered by Chasum’s Knowledge Engine and Business Discovery — not a scripted demo.",
} as const;

export const MEET_SUMMER_JOURNEY = {
  eyebrow: "Roadmap",
  headline: "A journey toward the complete system.",
  steps: [
    { label: "Today", detail: "Website concierge & Early Access reception" },
    { label: "AI Reception", detail: "Front desk grounded in real availability" },
    { label: "CRM Intelligence", detail: "Context before every conversation" },
    { label: "Marketing Intelligence", detail: "Who to reach — and why" },
    { label: "Executive Advisor", detail: "Owner-level priorities across the business" },
    {
      label: "Complete AI Business Operating System",
      detail: "One shared brain across every department",
    },
  ],
} as const;

/** Legacy exports kept for Knowledge Engine prompts / older references */
export const MEET_SUMMER_TODAY = [
  {
    title: "Answer questions",
    detail: "Product, pricing, industries, and Private Alpha — grounded in Chasum’s Knowledge Engine.",
  },
  {
    title: "Explain features",
    detail: "Booking, CRM, calendar, payments, packages, and more — in plain language.",
  },
  {
    title: "Recommend plans",
    detail: "Helps match Free, Professional, Business, or Enterprise to how you actually operate.",
  },
  {
    title: "Guide visitors",
    detail: "Page-aware concierge that remembers this session’s context as you explore.",
  },
  {
    title: "Product tours",
    detail: "A short walk through Dashboard → Booking → CRM → Payments → Reports → AI vision.",
  },
  {
    title: "Choose workflows",
    detail: "Suggests where to start based on industry — ultrasound, salon, clinic, and beyond.",
  },
] as const;

export const MEET_SUMMER_INSIDE = [
  {
    title: "AI Reception",
    detail: "Front-desk conversations grounded in real hours, services, and availability.",
  },
  {
    title: "CRM Assistant",
    detail: "Context before every conversation — history, notes, and relationship cues.",
  },
  {
    title: "Scheduling Assistant",
    detail: "Protect the book, fill gaps, and explain conflicts without inventing slots.",
  },
  {
    title: "Billing Assistant",
    detail: "Deposits, packages, and gift value connected to the appointment graph.",
  },
  {
    title: "Marketing Assistant",
    detail: "Who to contact and why — reactivation and offers tied to real outcomes.",
  },
  {
    title: "Reporting Assistant",
    detail: "Explain what changed — not just another chart dump.",
  },
  {
    title: "Executive Business Advisor",
    detail: "Owner-level priorities across revenue, capacity, and risk.",
  },
] as const;

export const MEET_SUMMER_NEED = [
  {
    title: "Remembers customers",
    detail: "Relationships and visit patterns stay connected — not lost in inboxes.",
  },
  {
    title: "Understands trends",
    detail: "Sees underbooked days, package momentum, and quiet clients before you do.",
  },
  {
    title: "Explains reports",
    detail: "Turns “what happened” into “what it means for the business.”",
  },
  {
    title: "Recommends actions",
    detail: "Decision-driven screens answer one question at a time — with a next step.",
  },
  {
    title: "Learns over time",
    detail: "Business memory compounds seasonally — smarter every year you stay.",
  },
] as const;

export const MEET_SUMMER_ROADMAP = [
  {
    phase: "Today",
    items: ["AI Website Concierge", "Early Access AI Reception"],
  },
  {
    phase: "Next",
    items: ["CRM Intelligence", "Marketing Intelligence", "Business Intelligence"],
  },
  {
    phase: "Future",
    items: ["Complete AI Business Operating System"],
  },
] as const;

export const MEET_SUMMER_VISION = {
  eyebrow: "Vision",
  headline: "Not another feature page — an introduction",
  lead:
    "This page should feel like you are being introduced to one of Chasum’s flagship products. It tells a story — not simply a list of features.",
  promise:
    "By the time you reach the Private Alpha application, you should clearly understand who Summer is, why she exists, how she helps businesses, and why she is different from a traditional chatbot.",
} as const;

export const MEET_SUMMER_STORY = [
  {
    title: "Who Summer is",
    detail:
      "Summer is Chasum’s AI Business Assistant — the intelligence layer of the operating system. She is the first face of the product for many visitors, and the companion that will grow with the business inside Chasum.",
  },
  {
    title: "Why Summer exists",
    detail:
      "Service businesses already have calendars, CRMs, and chat tools that store information. What they lack is something that understands that information. Summer exists to close that gap.",
  },
  {
    title: "How Summer helps businesses",
    detail:
      "Today she answers questions, explains the product, recommends plans, and guides a tour. Inside Chasum she is designed to assist reception, CRM, scheduling, billing, marketing, reporting, and eventually executive decisions — one shared Business Brain, different jobs.",
  },
  {
    title: "Why Summer is different from a chatbot",
    detail:
      "A traditional chatbot scripts replies and forgets the business. Summer is grounded in a Knowledge Engine, remembers this session, and is built toward business memory — understanding trends, customers, and what to do next — not clever small talk.",
  },
] as const;
