/**
 * Homepage marketing content — grounded in real Chasum departments.
 * Keep claims conservative; mark future items clearly.
 */

export const DEMO_HREF =
  "mailto:sales@chasum.app?subject=Book%20a%20Chasum%20Demo";

export const TRUSTED_STATS = [
  { label: "Departments", value: 9, suffix: "+", hint: "Real product modules" },
  { label: "Industries served", value: 10, suffix: "+", hint: "One configurable OS" },
  { label: "Plan tiers", value: 4, suffix: "", hint: "Free → Enterprise" },
  { label: "AI employees named", value: 6, suffix: "", hint: "Emma live · more coming" },
  { label: "Journey steps", value: 7, suffix: "", hint: "Book → report connected" },
] as const;

export type PlatformModule = {
  id: string;
  name: string;
  href: string;
  benefit: string;
  explanation: string;
  cta: string;
  ctaHref: string;
  comingSoon?: boolean;
  preview: "emma" | "crm" | "calendar" | "employees" | "business" | "reports" | "communication" | "billing" | "workforce";
};

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "emma",
    name: "AI Receptionist",
    href: "/#platform-emma",
    benefit: "Answer common questions and start bookings without inventing availability.",
    explanation:
      "Emma uses your real hours, services, staff, and locations — then recommends slots from the scheduling engine and escalates to humans when needed.",
    cta: "Meet Emma",
    ctaHref: "/signup",
    preview: "emma",
  },
  {
    id: "crm",
    name: "CRM",
    href: "/#platform-crm",
    benefit: "Know every customer history, note, and conversation in one profile.",
    explanation:
      "Directory, profiles, timeline, documents, and payment events — connected to appointments and Communication Center.",
    cta: "Explore CRM",
    ctaHref: "/signup",
    preview: "crm",
  },
  {
    id: "calendar",
    name: "Calendar & Booking",
    href: "/#platform-calendar",
    benefit: "Fill the day with real openings — never invented times.",
    explanation:
      "Reception calendar, public booking pages, waitlist, buffers, rooms/resources, and a customer portal built on the same engine.",
    cta: "See booking",
    ctaHref: "/signup",
    preview: "calendar",
  },
  {
    id: "employees",
    name: "Employee Management",
    href: "/#platform-employees",
    benefit: "Run the team with schedules, roles, and performance in one place.",
    explanation:
      "Directory, profiles, departments, location assignments, payroll fields, documents, and activity — ready for multi-staff operations.",
    cta: "Manage team",
    ctaHref: "/signup",
    preview: "employees",
  },
  {
    id: "business",
    name: "Business Management",
    href: "/#platform-business",
    benefit: "Configure how the company operates — for one site or many.",
    explanation:
      "Profile, locations, categories, rooms & resources, memberships, packages, gift cards, taxes, forms, and automation rules.",
    cta: "Configure business",
    ctaHref: "/signup",
    preview: "business",
  },
  {
    id: "reports",
    name: "Reports & Analytics",
    href: "/#platform-reports",
    benefit: "Understand performance in minutes, not spreadsheets.",
    explanation:
      "Executive KPIs, revenue by employee/location/service, appointments, customers, financials, exports, and scheduled reports.",
    cta: "View reports",
    ctaHref: "/signup",
    preview: "reports",
  },
  {
    id: "communication",
    name: "Communication Center",
    href: "/#platform-communication",
    benefit: "Call, text, email, and follow up without leaving the customer record.",
    explanation:
      "Unified timeline, notes, reminders, and pluggable providers (Resend, Twilio) ready for production messaging.",
    cta: "Open communications",
    ctaHref: "/signup",
    preview: "communication",
  },
  {
    id: "billing",
    name: "Billing",
    href: "/#platform-billing",
    benefit: "Plans, trials, and invoices with a path to live payments.",
    explanation:
      "Free through Enterprise catalog, customer billing UI, subscription events, and a provider interface ready for Stripe.",
    cta: "See pricing",
    ctaHref: "/pricing",
    preview: "billing",
  },
  {
    id: "workforce",
    name: "AI Workforce",
    href: "/#ai-workforce",
    benefit: "A named team of AI employees that remove operational drag.",
    explanation:
      "Emma is live in Phase 1. Alex, Maya, Leo, Sophia, and Noah deepen the vision — assist first, automate with owner control.",
    cta: "See the vision",
    ctaHref: "/#ai-workforce",
    comingSoon: true,
    preview: "workforce",
  },
];

export const INDUSTRIES = [
  {
    name: "Medical Clinics",
    problem: "Intake, providers, rooms, and follow-ups scatter across tools.",
    solution:
      "Chasum unifies booking, CRM notes, forms readiness, and reception workflows with tenant-safe records.",
    modules: ["Calendar & Booking", "CRM", "Business Management", "Communication"],
  },
  {
    name: "Salons",
    problem: "Stylist schedules, rebooking, and no-shows drain the front desk.",
    solution:
      "Staff-aware slots, CRM history, reminders, and reports show who drives revenue.",
    modules: ["Employees", "Calendar & Booking", "CRM", "Reports"],
  },
  {
    name: "Spas",
    problem: "Packages, memberships, and treatment rooms are hard to track.",
    solution:
      "Business Management supports packages, memberships, rooms/resources, and location hours.",
    modules: ["Business Management", "Calendar & Booking", "Billing", "CRM"],
  },
  {
    name: "Gyms",
    problem: "Classes, trainers, and memberships need one operating layer.",
    solution:
      "Employees, services, recurring patterns, and membership scaffolds sit beside CRM and billing.",
    modules: ["Employees", "Business Management", "CRM", "Reports"],
  },
  {
    name: "Automotive",
    problem: "Bays, techs, and customer vehicles create scheduling chaos.",
    solution:
      "Resources/rooms, staff assignment, and CRM timelines keep jobs and clients connected.",
    modules: ["Business Management", "Employees", "Calendar & Booking", "CRM"],
  },
  {
    name: "Contractors",
    problem: "Field jobs, estimate follow-ups, and calendars rarely sync.",
    solution:
      "Location-aware booking, CRM follow-ups, and Communication Center keep jobs moving.",
    modules: ["Calendar & Booking", "CRM", "Communication", "Employees"],
  },
  {
    name: "Photography",
    problem: "Sessions, edits, and client communication live in inboxes.",
    solution:
      "Public booking, deposits/commercial appointment fields, and CRM keep shoots organized.",
    modules: ["Calendar & Booking", "CRM", "Billing", "Reports"],
  },
  {
    name: "Pet Services",
    problem: "Recurring visits and pet notes get lost between bookings.",
    solution:
      "CRM profiles, notes, reminders, and calendar protect the relationship and the schedule.",
    modules: ["CRM", "Calendar & Booking", "Communication", "AI Receptionist"],
  },
  {
    name: "Cleaning",
    problem: "Recurring routes and last-minute changes overwhelm dispatch.",
    solution:
      "Scheduling engine, waitlist, automation rules, and employee assignments reduce scramble.",
    modules: ["Calendar & Booking", "Employees", "Business Management", "Reports"],
  },
  {
    name: "Professional Services",
    problem: "Consultants need polished booking without a full clinic stack.",
    solution:
      "Branded booking pages, CRM, reports, and Free → Enterprise plans scale with the practice.",
    modules: ["Calendar & Booking", "CRM", "Reports", "Billing"],
  },
] as const;

export const CUSTOMER_JOURNEY = [
  { step: "1", title: "Customer books", detail: "Public booking or reception creates the visit." },
  { step: "2", title: "Emma responds", detail: "AI Receptionist answers from real business data." },
  { step: "3", title: "CRM updates", detail: "Profile and timeline capture the interaction." },
  { step: "4", title: "Appointment confirmed", detail: "Scheduling engine books a real open slot." },
  { step: "5", title: "Reminder sent", detail: "Communication Center delivers email or SMS." },
  { step: "6", title: "Payment collected", detail: "Deposits and payment events stay linked." },
  { step: "7", title: "Reports updated", detail: "Owner KPIs refresh across the business." },
] as const;

export const HERO_STATS = [
  { label: "Departments", value: 9, suffix: "+" },
  { label: "AI Receptionist", value: 1, suffix: " live" },
  { label: "Plan options", value: 4, suffix: "" },
] as const;

export const AI_EMPLOYEES_PREVIEW = [
  {
    name: "Emma",
    role: "AI Receptionist",
    specialty: "Front desk & booking",
    status: "Live",
    availability: "Available Today",
    summary:
      "Answers from real business data, checks real slots, starts bookings, escalates to staff, and logs every handoff.",
  },
  {
    name: "Alex",
    role: "AI Scheduler",
    specialty: "Calendar optimization",
    status: "Planned",
    availability: "Coming Soon",
    summary: "Protects the calendar and coordinates availability without inventing times.",
  },
  {
    name: "Maya",
    role: "AI Marketer",
    specialty: "Customer outreach",
    status: "Planned",
    availability: "Coming Soon",
    summary: "Prepares owner-approved campaigns and thoughtful follow-up without spam.",
  },
  {
    name: "Leo",
    role: "AI Business Advisor",
    specialty: "Performance insights",
    status: "Planned",
    availability: "Coming Soon",
    summary: "Turns operational signals into clear summaries and practical next steps.",
  },
  {
    name: "Sophia",
    role: "AI Customer Success",
    specialty: "Customer care",
    status: "Planned",
    availability: "Coming Soon",
    summary: "Coordinates preparation, follow-up, and relationship care after booking.",
  },
  {
    name: "Noah",
    role: "AI Operations",
    specialty: "Cross-team coordination",
    status: "Planned",
    availability: "Coming Soon",
    summary: "Coordinates handoffs across the AI Workforce with owner control.",
  },
] as const;

/** Honest comparison scaffold — update cells as capabilities ship. Avoid unverified competitor claims. */
export type ComparisonValue = "yes" | "partial" | "roadmap" | "varies";

export const COMPARISON_COLUMNS = [
  "Chasum",
  "Picktime",
  "Fresha",
  "Vagaro",
  "Calendly",
  "Square Appointments",
] as const;

export const COMPARISON_ROWS: {
  feature: string;
  values: Record<(typeof COMPARISON_COLUMNS)[number], ComparisonValue>;
  note?: string;
}[] = [
  {
    feature: "AI Business Operating System positioning",
    values: {
      Chasum: "yes",
      Picktime: "varies",
      Fresha: "varies",
      Vagaro: "varies",
      Calendly: "varies",
      "Square Appointments": "varies",
    },
    note: "Competitor scopes vary by plan; evaluate against your industry needs.",
  },
  {
    feature: "Multi-tenant business + location architecture",
    values: {
      Chasum: "yes",
      Picktime: "varies",
      Fresha: "varies",
      Vagaro: "varies",
      Calendly: "partial",
      "Square Appointments": "varies",
    },
  },
  {
    feature: "CRM + Communication Center in-product",
    values: {
      Chasum: "yes",
      Picktime: "varies",
      Fresha: "partial",
      Vagaro: "partial",
      Calendly: "partial",
      "Square Appointments": "partial",
    },
  },
  {
    feature: "AI Receptionist grounded in live business data",
    values: {
      Chasum: "yes",
      Picktime: "roadmap",
      Fresha: "varies",
      Vagaro: "varies",
      Calendly: "varies",
      "Square Appointments": "varies",
    },
    note: "Emma Phase 1 is live in Chasum; competitor AI features change frequently.",
  },
  {
    feature: "Reports & Analytics department",
    values: {
      Chasum: "yes",
      Picktime: "partial",
      Fresha: "partial",
      Vagaro: "partial",
      Calendly: "partial",
      "Square Appointments": "partial",
    },
  },
  {
    feature: "Named AI Workforce roadmap (assist → automate)",
    values: {
      Chasum: "roadmap",
      Picktime: "varies",
      Fresha: "varies",
      Vagaro: "varies",
      Calendly: "varies",
      "Square Appointments": "varies",
    },
  },
];

export const FAQ_ITEMS = [
  {
    q: "What is Chasum?",
    a: "Chasum is an AI Business Operating System for service businesses — scheduling, CRM, employees, communication, reports, billing, and AI employees in one multi-tenant platform.",
  },
  {
    q: "Is Chasum just another booking page?",
    a: "No. Public booking is one surface. The product includes Reception calendar, CRM, Business Management, Reports, Communication Center, Billing, and AI Receptionist (Emma).",
  },
  {
    q: "Does AI invent appointment times?",
    a: "No. Availability recommendations come from Chasum’s scheduling engine (get_available_slots). If there are no openings, Chasum shows empty — it does not invent times.",
  },
  {
    q: "Can I run multiple locations?",
    a: "Yes. The platform is built for single-location through multi-location operations with location scope across calendar, services, staff, and reports.",
  },
  {
    q: "What is included in the Free plan?",
    a: "Free includes a booking page, core calendar & reception, email reminders, and a single location. Upgrade when you need more AI assistance, SMS, automation, or locations.",
  },
  {
    q: "How does Emma the AI Receptionist work today?",
    a: "Phase 1 Emma answers from your configured hours, services, employees, and locations; recommends real slots; starts the booking flow; escalates to staff; and can log into CRM / Communication Center.",
  },
  {
    q: "Do you support Google, Outlook, and Apple calendars?",
    a: "Yes. Calendar integrations are part of the platform so external busy times can inform conflict detection — without replacing Chasum as the system of record for bookings.",
  },
  {
    q: "Is my business data isolated from other customers?",
    a: "Yes. Chasum is multi-tenant with business_id scoping and row-level security. Your data is not shared across tenants.",
  },
  {
    q: "When is voice calling available?",
    a: "Voice is architected for the future (channel reserved) but not implemented yet. Emma’s Phase 1 focus is grounded chat and booking assist.",
  },
  {
    q: "How do I book a demo?",
    a: "Use Book Demo to email sales@chasum.app, or Start Free to explore the product with your own business data immediately.",
  },
] as const;
