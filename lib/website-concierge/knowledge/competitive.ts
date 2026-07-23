import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";

/**
 * Competitive positioning — philosophy first.
 * Do not criticize competitors; explain how Chasum thinks.
 * Inspired by the product Innovation / competitive ledger posture.
 */
export const COMPETITIVE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "competitive-philosophy",
    category: "competitive",
    title: "Chasum Philosophy vs Market",
    summary: "Operating system + Business Brain, not a booking widget.",
    body:
      "Many strong products help beauty, wellness, or meetings businesses book time. Chasum’s philosophy is different: become the AI Business Operating System — unified scheduling truth, CRM and money in-graph, and AI roles that share one brain. We respect category leaders; we optimize for operators who want understanding and decisions, not only a calendar.",
    tags: ["compare", "vs", "difference", "philosophy", "alternative", "competitor"],
    followUps: ["How do you think about Fresha?", "What about Square?"],
    relatedIds: ["company-bos", "feature-ai"],
  },
  {
    id: "competitive-fresha",
    category: "competitive",
    title: "Relative to Fresha",
    summary: "Vertical beauty excellence vs cross-industry OS ambition.",
    body:
      "Fresha is a well-known beauty-vertical platform. Chasum’s approach is industry-configurable OS design — ultrasound, spa, clinic, and more — with a long-term Business Brain and named AI workforce roadmap. If you love a beauty-first marketplace, Fresha may fit; if you want one brain across operations and AI roles, explore Chasum.",
    tags: ["fresha", "beauty"],
    followUps: ["Salon workflows on Chasum?", "Pricing?"],
    relatedIds: ["industry-salon", "competitive-philosophy"],
  },
  {
    id: "competitive-vagaro",
    category: "competitive",
    title: "Relative to Vagaro",
    summary: "All-in-one salon/spa suites vs decision-driven OS screens.",
    body:
      "Vagaro offers broad salon/spa tooling. Chasum emphasizes decision-driven screens (“What should I focus on today?”) and a shared AI knowledge layer. Choose based on whether you want a familiar suite today or an OS built toward business understanding over time.",
    tags: ["vagaro"],
    followUps: ["Spa recommendations?", "AI features?"],
    relatedIds: ["industry-spa", "feature-ai"],
  },
  {
    id: "competitive-jane",
    category: "competitive",
    title: "Relative to Jane",
    summary: "Clinic-oriented practice software vs multi-industry OS.",
    body:
      "Jane is known in clinic-oriented practice management. Chasum aims at appointment businesses broadly with multi-tenant location architecture and AI workforce vision. Clinics evaluating either should match compliance needs and workflow depth to their specialty.",
    tags: ["jane", "clinic software"],
    followUps: ["Physiotherapy or chiropractic fit?", "Security?"],
    relatedIds: ["industry-physiotherapy", "industry-chiropractic", "faq-security"],
  },
  {
    id: "competitive-glossgenius",
    category: "competitive",
    title: "Relative to GlossGenius",
    summary: "Creator/beauty pro tooling vs business-brain OS.",
    body:
      "GlossGenius serves beauty professionals with polished booking and business tools. Chasum focuses on OS-level unification — CRM, reports, commerce graph, and AI roles sharing memory — for operators building toward multi-staff and multi-location complexity.",
    tags: ["glossgenius", "gloss genius"],
    followUps: ["Employee management?", "Multi-location?"],
    relatedIds: ["feature-employees", "feature-multi-location"],
  },
  {
    id: "competitive-boulevard",
    category: "competitive",
    title: "Relative to Boulevard",
    summary: "Premium salon platform vs open AI Business OS direction.",
    body:
      "Boulevard is recognized for premium salon experiences. Chasum’s bet is an AI Business Operating System with honest Private Alpha partnership and a knowledge graph toward business health — complementary philosophies depending on brand and scale needs.",
    tags: ["boulevard"],
    followUps: ["Salon industry guide", "Private Alpha?"],
    relatedIds: ["industry-salon", "pricing-alpha"],
  },
  {
    id: "competitive-booksy",
    category: "competitive",
    title: "Relative to Booksy",
    summary: "Marketplace discovery vs owned operating system.",
    body:
      "Booksy includes marketplace-style discovery for local services. Chasum prioritizes the owned operating system — your brand, your data graph, your AI brain — rather than discovery as the primary growth loop.",
    tags: ["booksy", "marketplace"],
    followUps: ["Online booking branding?", "Data ownership?"],
    relatedIds: ["feature-booking", "faq-data-ownership"],
  },
  {
    id: "competitive-square",
    category: "competitive",
    title: "Relative to Square Appointments",
    summary: "POS-adjacent booking vs deep schedule + AI OS.",
    body:
      "Square Appointments is strong when payments/POS are the center of gravity. Chasum starts from unified scheduling and business understanding, with commerce connected to the appointment graph. Operators deep in Square hardware may stay; operators wanting OS + AI workforce should evaluate Chasum.",
    tags: ["square", "square appointments", "pos"],
    followUps: ["Payments on Chasum?", "Reports?"],
    relatedIds: ["feature-payments", "feature-reports"],
  },
  {
    id: "competitive-mindbody",
    category: "competitive",
    title: "Relative to Mindbody",
    summary: "Fitness/wellness scale platforms vs focused service OS.",
    body:
      "Mindbody is scaled for fitness and wellness ecosystems. Chasum targets appointment-based service operators who want a modern multi-tenant OS and AI roles without enterprise fitness marketplace complexity — especially studios and clinics that want clarity over sprawling suites.",
    tags: ["mindbody", "mind body"],
    followUps: ["Fitness-adjacent spa fit?", "Pricing?"],
    relatedIds: ["industry-spa", "pricing-plans"],
  },
];
