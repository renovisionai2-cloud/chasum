import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";
import {
  CHASUM_NOT_SCHEDULER,
  CHASUM_OS_PRIMARY,
  CHASUM_SUMMER_PRIMARY,
} from "@/lib/marketing/os-positioning";

export const COMPANY_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "company-mission",
    category: "company",
    title: "Chasum Mission",
    summary:
      "Chasum is an AI Business Operating System for service businesses—not another appointment scheduler.",
    body:
      `${CHASUM_NOT_SCHEDULER} ${CHASUM_OS_PRIMARY} ${CHASUM_SUMMER_PRIMARY}`,
    tags: ["mission", "chasum", "purpose", "why"],
    followUps: ["What is the AI Business Operating System?", "How is this different from booking software?"],
    relatedIds: ["company-vision", "company-why"],
  },
  {
    id: "company-vision",
    category: "company",
    title: "Vision",
    summary: "The world’s best AI Business Operating System for service businesses.",
    body:
      "The long-term vision is Chasum as the world’s best AI Business Operating System for ultrasound studios, salons, spas, clinics, and similar operators — understanding the business, not only storing its data.",
    tags: ["vision", "future", "ambition"],
    followUps: ["What is the Business Brain?", "Would you like a two-minute product tour?"],
    relatedIds: ["company-bos", "tour-intro"],
  },
  {
    id: "company-bos",
    category: "company",
    title: "AI Business Operating System",
    summary: "One brain across scheduling, customers, staff, payments, communications, reporting, automation, and AI.",
    body:
      "An AI Business Operating System unifies scheduling, customers, staff, payments, communications, reporting, automation, and AI with a shared Business Brain. Individual capabilities are labelled Available Today, Early Access, Coming Next, or Future Vision—Chasum does not claim full autonomous AI operation today.",
    tags: ["operating system", "bos", "business brain", "ai os"],
    followUps: ["How do decision-driven screens work?", "Tell me about Summer and Chase"],
    relatedIds: ["feature-ai", "company-why"],
  },
  {
    id: "company-why",
    category: "company",
    title: "Why Chasum Exists",
    summary: "Service businesses deserve more than a booking widget.",
    body:
      "Chasum exists because appointment businesses lose time and revenue to fragmented tools — calendars that disagree, weak CRM context, and AI bolted on without business truth. We build from a unified scheduling core toward understanding revenue, staff, packages, and customers.",
    tags: ["why", "problem", "exists", "fragmentation"],
    followUps: ["Which features should I start with?", "How do you compare philosophically to Fresha or Square?"],
    relatedIds: ["company-story", "competitive-philosophy"],
  },
  {
    id: "company-story",
    category: "company",
    title: "Company Story",
    summary: "Designed with real service operators, starting in Private Alpha.",
    body:
      "Chasum is built with design partners in Private Alpha — including appointment operators who need reliable booking, client context, and honest AI. We ship founder-supported partnerships first, then broaden as the operating system earns trust.",
    tags: ["story", "alpha", "design partner", "gvm"],
    followUps: ["What is Private Alpha?", "How do I apply?"],
    relatedIds: ["pricing-alpha", "faq-support"],
  },
];
