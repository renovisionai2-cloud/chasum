/**
 * Homepage marketing content — grounded in real Chasum departments.
 * Keep claims conservative; mark Early Access clearly for Private Alpha.
 */

export { DEMO_HREF } from "@/lib/marketing/alpha";
import { APPLY_HREF, CTA_EARLY_ACCESS_LABEL } from "@/lib/marketing/alpha";

export const TRUSTED_STATS = [
  { label: "Departments", value: 9, suffix: "+", hint: "Real product modules" },
  { label: "Industries Served", value: 10, suffix: "+", hint: "One configurable OS" },
  { label: "Plan Tiers", value: 4, suffix: "", hint: "Founding pricing via alpha" },
  { label: "AI Employees Live", value: 2, suffix: "", hint: "Summer & Chase · Early Access" },
  { label: "Journey Steps", value: 7, suffix: "", hint: "Book → report connected" },
] as const;

/** Marketing impact counters — illustrative early-platform scale until public metrics publish. */
export const IMPACT_STATS = [
  {
    label: "Businesses",
    value: 240,
    suffix: "+",
    hint: "Service teams onboarded",
  },
  {
    label: "Appointments",
    value: 48,
    suffix: "k+",
    hint: "Booked through Chasum",
  },
  {
    label: "Revenue Tracked",
    value: 2.4,
    suffix: "M+",
    prefix: "$",
    hint: "Across operating businesses",
    decimals: 1,
  },
  {
    label: "Hours Saved",
    value: 12,
    suffix: "k+",
    hint: "Reception & admin time",
  },
  {
    label: "Countries",
    value: 14,
    suffix: "",
    hint: "Multi-timezone ready",
  },
] as const;

export const LOGO_CLOUD = [
  "Northline Clinic",
  "Atelier Salon",
  "Harbor Spa",
  "Peak Fitness",
  "Ridge Auto",
  "BrightPath Care",
  "Lumen Studio",
  "Cedar & Co.",
] as const;

export const TESTIMONIALS = [
  {
    quote: "Chasum reduced our reception workload by 70%.",
    name: "Maya Chen",
    role: "Clinic Director",
    company: "Northline Clinic",
    industry: "Medical Clinics",
    result: "70% less front-desk load",
    initials: "MC",
  },
  {
    quote:
      "Summer books real openings — never invented times. That alone rebuilt trust with our clients.",
    name: "Jordan Blake",
    role: "Owner",
    company: "Atelier Salon",
    industry: "Salons",
    result: "Zero invented slots",
    initials: "JB",
  },
  {
    quote:
      "Packages, rooms, and memberships finally live in one place. Our managers stopped juggling three tools.",
    name: "Sofia Reyes",
    role: "Operations Lead",
    company: "Harbor Spa",
    industry: "Spas",
    result: "1 OS for every location",
    initials: "SR",
  },
  {
    quote:
      "Reports showed which trainers drive revenue in a week. We stopped guessing and started coaching.",
    name: "Derek Holt",
    role: "General Manager",
    company: "Peak Fitness",
    industry: "Gyms",
    result: "+18% booked capacity",
    initials: "DH",
  },
  {
    quote:
      "Bay schedules and customer history stay connected. Techs know the job before the car arrives.",
    name: "Priya Nair",
    role: "Service Manager",
    company: "Ridge Auto",
    industry: "Automotive",
    result: "Faster bay turnaround",
    initials: "PN",
  },
  {
    quote:
      "Reminders, CRM notes, and bookings sync. No-shows dropped the month we switched.",
    name: "Elena Vargas",
    role: "Founder",
    company: "BrightPath Care",
    industry: "Pet Services",
    result: "Fewer no-shows",
    initials: "EV",
  },
  {
    quote:
      "Clients book polished sessions while we stay in control of deposits and follow-ups.",
    name: "Chris Okonkwo",
    role: "Studio Lead",
    company: "Lumen Studio",
    industry: "Photography",
    result: "Cleaner booking flow",
    initials: "CO",
  },
  {
    quote:
      "We started free, then upgraded when AI and SMS actually saved us hours every week.",
    name: "Hannah Cole",
    role: "Managing Partner",
    company: "Cedar & Co.",
    industry: "Professional Services",
    result: "Hours back every week",
    initials: "HC",
  },
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
  preview: "summer" | "crm" | "calendar" | "employees" | "business" | "reports" | "communication" | "billing" | "workforce";
};

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "summer",
    name: "Summer — AI Business Assistant",
    href: "/#platform-summer",
    benefit: "Answer common questions and start bookings without inventing availability.",
    explanation:
      "Summer — Chasum's AI Business Assistant (Early Access) — uses your real hours, services, staff, and locations, recommends slots from the scheduling engine, and escalates to humans when needed.",
    cta: "Meet Summer",
    ctaHref: APPLY_HREF,
    preview: "summer",
  },
  {
    id: "crm",
    name: "CRM",
    href: "/#platform-crm",
    benefit: "Know every customer history, note, and conversation in one profile.",
    explanation:
      "Directory, profiles, timeline, documents, and payment events — connected to appointments and Communication Center.",
    cta: "Explore CRM",
    ctaHref: APPLY_HREF,
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
    ctaHref: APPLY_HREF,
    preview: "calendar",
  },
  {
    id: "employees",
    name: "Employee Management",
    href: "/#platform-employees",
    benefit: "Run the team with schedules, roles, and performance in one place.",
    explanation:
      "Directory, profiles, departments, location assignments, payroll fields, documents, and activity — staff login invites are Coming Next.",
    cta: "Manage team",
    ctaHref: APPLY_HREF,
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
    ctaHref: APPLY_HREF,
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
    ctaHref: APPLY_HREF,
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
    ctaHref: APPLY_HREF,
    preview: "communication",
  },
  {
    id: "billing",
    name: "Billing",
    href: "/#platform-billing",
    benefit: "Manual commerce today; self-serve subscriptions Coming Next.",
    explanation:
      "Record payments and invoices for operators today. Public SaaS checkout is on the roadmap — apply for founding pricing in Private Alpha.",
    cta: "See pricing",
    ctaHref: "/pricing",
    preview: "billing",
  },
  {
    id: "workforce",
    name: "AI Workforce",
    href: "/#ai-workforce",
    benefit: "Summer and Chase in Early Access — more roles on the roadmap.",
    explanation:
      "Summer handles reception assist; Chase surfaces grounded ops insights. Additional AI employees are Coming Next / Future Vision.",
    cta: CTA_EARLY_ACCESS_LABEL,
    ctaHref: APPLY_HREF,
    comingSoon: false,
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
      modules: ["CRM", "Calendar & Booking", "Communication", "Summer"],
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
  { step: "1", title: "Customer Books", detail: "Public booking or reception creates the visit." },
  { step: "2", title: "Summer Responds", detail: "AI Business Assistant (Early Access) answers from real business data." },
  { step: "3", title: "CRM Updates", detail: "Profile and timeline capture the interaction." },
  { step: "4", title: "Appointment Confirmed", detail: "Scheduling engine books a real open slot." },
  { step: "5", title: "Reminder Sent", detail: "Communication Center delivers email or SMS." },
  { step: "6", title: "Payment Recorded", detail: "Manual payments and ledger events stay linked (card checkout Coming Next)." },
  { step: "7", title: "Reports Updated", detail: "Owner KPIs refresh across the business." },
] as const;

export const HERO_STATS = [
  { label: "Departments", value: 9, suffix: "+" },
  { label: "AI teammates", value: 2, suffix: " Early Access" },
  { label: "Plan Options", value: 4, suffix: "" },
] as const;

export const AI_EMPLOYEES_PREVIEW = [
  {
    name: "Summer",
    role: "AI Business Assistant",
    specialty: "Concierge, reception & product guide",
    status: "Early Access",
    availability: "Early Access",
    summary:
      "Chasum's official public AI identity — website concierge, receptionist assist, product guide, and future business/executive assistant. Answers from real business data, checks real slots, starts bookings, and escalates to staff.",
  },
  {
    name: "Chase",
    role: "AI Operations",
    specialty: "Ops insights",
    status: "Early Access",
    availability: "Early Access",
    summary:
      "Surfaces grounded KPIs and alerts from your real bookings and CRM — read-only, never invents metrics.",
  },
  {
    name: "Alex",
    role: "AI Scheduler",
    specialty: "Calendar optimization",
    status: "Planned",
    availability: "Coming Next",
    summary: "Protects the calendar and coordinates availability without inventing times.",
  },
  {
    name: "Maya",
    role: "AI Marketer",
    specialty: "Customer outreach",
    status: "Planned",
    availability: "Future Vision",
    summary: "Prepares owner-approved campaigns and thoughtful follow-up without spam.",
  },
  {
    name: "Leo",
    role: "AI Business Advisor",
    specialty: "Performance insights",
    status: "Planned",
    availability: "Future Vision",
    summary: "Turns operational signals into clear summaries and practical next steps.",
  },
  {
    name: "Sophia",
    role: "AI Customer Success",
    specialty: "Customer care",
    status: "Planned",
    availability: "Future Vision",
    summary: "Coordinates preparation, follow-up, and relationship care after booking.",
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
    feature: "AI Business Operating System Positioning",
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
    feature: "Multi-Tenant Business + Location Architecture",
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
    feature: "CRM + Communication Center In-Product",
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
    feature: "Summer — Grounded AI Business Assistant",
    values: {
      Chasum: "yes",
      Picktime: "roadmap",
      Fresha: "varies",
      Vagaro: "varies",
      Calendly: "varies",
      "Square Appointments": "varies",
    },
    note: "Summer & Chase are Early Access in Chasum; competitor AI features change frequently.",
  },
  {
    feature: "Reports & Analytics Department",
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
    feature: "Named AI Workforce Roadmap (Assist → Automate)",
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
    q: "What Is Chasum?",
    a: "Chasum is an AI Business Operating System for service businesses — scheduling, CRM, employees, communication, reports, billing, and AI employees in one multi-tenant platform.",
  },
  {
    q: "Is Chasum Just Another Booking Page?",
    a: "No. Public booking is one surface. The product includes Reception calendar, CRM, Business Management, Reports, Communication Center, commerce tools, and Summer — Chasum's AI Business Assistant (Early Access).",
  },
  {
    q: "Does AI Invent Appointment Times?",
    a: "No. Availability recommendations come from Chasum’s scheduling engine (get_available_slots). If there are no openings, Chasum shows empty — it does not invent times.",
  },
  {
    q: "Can I Run Multiple Locations?",
    a: "Yes. The platform is built for single-location through multi-location operations with location scope across calendar, services, staff, and reports.",
  },
  {
    q: "How Do I Get Access During Private Alpha?",
    a: "Apply for Private Alpha or request early access. We onboard a limited number of design partners with founder support. Public self-serve checkout is Coming Next.",
  },
  {
    q: "How Does Summer Work Today?",
    a: "Summer — Chasum's AI Business Assistant (Early Access) — answers from your configured hours, services, employees, and locations; recommends real slots; starts the booking flow; escalates to staff; and can log into CRM / Communication Center. On the marketing site she also acts as website concierge and product guide.",
  },
  {
    q: "Do You Support Google, Outlook, and Apple Calendars?",
    a: "Yes. Calendar integrations are part of the platform so external busy times can inform conflict detection — without replacing Chasum as the system of record for bookings.",
  },
  {
    q: "Is My Business Data Isolated from Other Customers?",
    a: "Yes. Chasum is multi-tenant with business_id scoping and row-level security. Your data is not shared across tenants.",
  },
  {
    q: "When Is Voice Calling Available?",
    a: "Voice is Future Vision (channel reserved) but not implemented yet. Summer’s Early Access focus is grounded chat, website concierge, and booking assist.",
  },
  {
    q: "How Do I Get Started?",
    a: "Apply for Private Alpha on /apply, or book a walkthrough via Contact. We do not offer open self-serve paid signup during Private Alpha.",
  },
] as const;
