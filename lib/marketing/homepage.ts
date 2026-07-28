/**
 * Homepage marketing content — grounded in real Chasum departments.
 * Keep claims conservative; mark Early Access clearly for Private Alpha.
 */

export { DEMO_HREF } from "@/lib/marketing/alpha";
import { APPLY_HREF, CTA_APPLY_LABEL, MEET_SUMMER_HREF } from "@/lib/marketing/alpha";

export const TRUSTED_STATS = [
  { label: "Departments", value: 9, suffix: "+", hint: "Real product modules" },
  { label: "Industries Served", value: 10, suffix: "+", hint: "One configurable OS" },
  { label: "Plan Tiers", value: 4, suffix: "", hint: "Founding pricing via alpha" },
  { label: "AI teammates", value: 2, suffix: "", hint: "Summer & Chase · Early Access" },
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
    industry: "Automotive Services",
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

/** Homepage platform categories — honest scope from Product Truth Matrix. */
export const PLATFORM_CATEGORIES = [
  {
    id: "scheduling",
    name: "Scheduling & Reception",
    description:
      "Manage appointments, availability and the front-desk workflow.",
  },
  {
    id: "crm",
    name: "Customers & CRM",
    description:
      "Keep customer details, history, notes and activity together.",
  },
  {
    id: "team",
    name: "Team & Locations",
    description:
      "Configure employees, services, hours and locations.",
  },
  {
    id: "communication",
    name: "Communication",
    description:
      "Send the confirmations, reminders and follow-ups supported by the configured messaging providers.",
  },
  {
    id: "commerce",
    name: "Commerce",
    description:
      "Record deposits, payments, balances, gift certificates, invoices and receipts from one financial record.",
  },
  {
    id: "reports",
    name: "Reports",
    description:
      "See appointments, revenue, employee activity and customer balances from connected operational data.",
  },
  {
    id: "ai",
    name: "AI Assistance",
    description:
      "Use Summer and Chase in Early Access for grounded help—not a collection of chatbots.",
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

/** Module copy for the product showcase — CTAs limited to Apply / Meet Summer. */
export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "summer",
    name: "Summer — AI Business Assistant",
    href: "/#platform-ai",
    benefit: "Answer common questions and start bookings without inventing availability.",
    explanation:
      "Summer — Chasum's AI Business Assistant (Early Access) — uses your real hours, services, staff, and locations, recommends slots from the scheduling engine, and escalates to humans when needed.",
    cta: "Meet Summer",
    ctaHref: MEET_SUMMER_HREF,
    preview: "summer",
  },
  {
    id: "crm",
    name: "CRM",
    href: "/#platform-crm",
    benefit: "Know every customer history, note, and conversation in one profile.",
    explanation:
      "Directory, profiles, timeline, documents, and payment events — connected to appointments and Communication Center.",
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
    preview: "crm",
  },
  {
    id: "calendar",
    name: "Calendar & Booking",
    href: "/#platform-scheduling",
    benefit: "Fill the day with real openings — never invented times.",
    explanation:
      "Reception calendar, public booking pages, waitlist, buffers, rooms/resources, and a customer portal built on the same engine.",
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
    preview: "calendar",
  },
  {
    id: "employees",
    name: "Employee Management",
    href: "/#platform-team",
    benefit: "Run the team with schedules, roles, and performance in one place.",
    explanation:
      "Directory, profiles, departments, location assignments, payroll fields, documents, and activity — staff login invites are Coming Next.",
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
    preview: "employees",
  },
  {
    id: "business",
    name: "Business Management",
    href: "/#platform-team",
    benefit: "Configure how the company operates — for one site or many.",
    explanation:
      "Profile, locations, categories, rooms & resources, memberships, packages, gift cards, taxes, forms, and automation rules.",
    cta: CTA_APPLY_LABEL,
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
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
    preview: "reports",
  },
  {
    id: "communication",
    name: "Communication Center",
    href: "/#platform-communication",
    benefit: "Call, text, email, and follow up without leaving the customer record.",
    explanation:
      "Unified timeline, notes, reminders, and pluggable providers (Resend, Twilio) when messaging is configured.",
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
    preview: "communication",
  },
  {
    id: "billing",
    name: "Billing",
    href: "/#platform-commerce",
    benefit: "Manual commerce today; self-serve subscriptions Coming Next.",
    explanation:
      "Record payments and invoices for operators today. Public SaaS checkout is on the roadmap — apply for founding pricing in Private Alpha.",
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
    preview: "billing",
  },
  {
    id: "workforce",
    name: "AI Workforce",
    href: "/#ai-workforce",
    benefit: "Summer and Chase in Early Access — more roles on the roadmap.",
    explanation:
      "Summer handles reception assist; Chase surfaces grounded ops insights. Additional AI employees are Coming Next / Future Vision.",
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
    comingSoon: false,
    preview: "workforce",
  },
];

/**
 * Full Industries page order (source of truth).
 * 1 Medical Clinics · 2 Legal Services · 3 Salons · 4 Spas · 5 Gyms ·
 * 6 Home & Field Services · 7 Automotive Services · 8 Professional Services ·
 * 9 Photography & Creative · 10 Pet Services · 11 Cleaning
 */
export const INDUSTRIES = [
  {
    name: "Medical Clinics",
    intro:
      "Designed for healthcare and wellness practices, including family medicine, imaging, physiotherapy, dental and related care businesses.",
    problem:
      "Appointments, providers, reminders and follow-ups often live in separate systems.",
    solution:
      "Today, Chasum helps manage appointment scheduling, CRM, reminders, communication, staff coordination, payments, reporting and business operations—with Summer available for AI reception support in Early Access. Industry-specific clinical workflows continue to evolve; Chasum supports the front of the practice alongside specialized clinical systems.",
    types: [
      "Family Medical Clinics",
      "Walk-in Clinics",
      "Private Ultrasound Clinics",
      "3D/4D/5D Baby Ultrasound Studios",
      "Diagnostic Imaging Clinics",
      "Physiotherapy Clinics",
      "Chiropractic Clinics",
      "Massage Therapy Clinics",
      "Mental Health & Psychology Practices",
      "Dental Clinics",
      "Optometry Clinics",
      "Veterinary Clinics",
    ],
    modules: [
      "Scheduling & Reception",
      "CRM",
      "Team & Locations",
      "Communication",
      "Payments",
      "Commerce & Reporting",
    ],
    note: "Healthcare-specific regulatory and clinical-record requirements must be assessed separately. Chasum is business operations software and must not be presented as an electronic medical record (EMR/EHR), PACS, diagnostic reporting system or clinical charting product unless that capability is intentionally built and legally reviewed.",
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Legal Services",
    intro:
      "Designed for legal practices that need consultations, appointments, client communication, billing and day-to-day business operations.",
    problem:
      "Consultations, client intake, follow-ups, billing and team coordination are hard to keep organized across disconnected tools.",
    solution:
      "Today, Chasum helps manage consultations, appointments, client communication, CRM, billing, team coordination and business operations—alongside specialized legal practice tools, not as a replacement for them. Industry-specific legal workflows continue to evolve.",
    types: [
      "Family Law",
      "Criminal Defence",
      "Personal Injury",
      "Immigration Law",
      "Real Estate Law",
      "Estate Planning",
      "Employment Law",
      "Corporate Law",
      "Civil Litigation",
      "General Practice",
    ],
    modules: [
      "Scheduling & Reception",
      "CRM",
      "Team & Locations",
      "Communication",
      "Payments",
      "Commerce & Reporting",
    ],
    note: "Data privacy, confidentiality and applicable legal requirements must be assessed separately. Chasum is business operations software and must not be presented as a substitute for legal advice, professional judgment, case management systems, legal document automation or court integrations unless those capabilities are intentionally built and verified.",
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Salons",
    intro:
      "Designed for hair salons, barbers and beauty studios that run on busy schedules and repeat clients.",
    problem:
      "Stylist schedules, rebooking and no-shows drain the front desk.",
    solution:
      "Today, Chasum helps manage appointment scheduling, staff coordination, CRM, reminders, communication and reporting so the floor and the client relationship stay connected. Industry-specific salon workflows continue to evolve.",
    types: ["Hair Salons", "Barbers", "Beauty Studios"],
    modules: [
      "Scheduling & Reception",
      "Team & Locations",
      "CRM",
      "Communication",
      "Reports",
    ],
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Spas",
    intro:
      "Designed for medical spas, day spas, wellness centres and massage studios.",
    problem:
      "Packages, room availability and repeat visits are hard to keep aligned.",
    solution:
      "Today, Chasum helps coordinate services, rooms and resources beside appointment scheduling, CRM, communication and commerce records. Industry-specific spa workflows continue to evolve.",
    types: [
      "Medical Spas",
      "Day Spas",
      "Wellness Centres",
      "Massage Studios",
    ],
    modules: [
      "Team & Locations",
      "Scheduling & Reception",
      "Commerce",
      "CRM",
    ],
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Gyms",
    intro:
      "Designed for gyms, personal trainers, yoga studios, pilates studios and martial arts schools.",
    problem:
      "Classes, trainers and memberships are hard to keep connected day to day.",
    solution:
      "Today, Chasum helps coordinate appointments, staff, CRM, membership configuration and reporting so training businesses stay organized. Industry-specific fitness workflows continue to evolve.",
    types: [
      "Gyms",
      "Personal Trainers",
      "Yoga Studios",
      "Pilates Studios",
      "Martial Arts Schools",
    ],
    modules: [
      "Team & Locations",
      "Scheduling & Reception",
      "CRM",
      "Reports",
    ],
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Home & Field Services",
    intro:
      "Designed for contractors and field service teams that need scheduling, dispatch, customer communication and crew coordination.",
    problem:
      "Field schedules, follow-ups and customer updates rarely stay in sync.",
    solution:
      "Today, Chasum helps manage appointments, dispatch-oriented scheduling, customer communication, CRM and staff coordination across locations. Industry-specific field workflows continue to evolve; specialized estimating and construction-project tools remain separate unless intentionally built into Chasum.",
    types: [
      "General Contractors",
      "Renovation Companies",
      "Electricians",
      "Plumbers",
      "HVAC",
      "Landscapers",
      "Painters",
      "Roofing",
      "Flooring",
    ],
    modules: [
      "Scheduling & Reception",
      "CRM",
      "Communication",
      "Team & Locations",
    ],
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Automotive Services",
    intro:
      "Designed for modern automotive service businesses, including collision, dealership service, mechanical repair, detailing and specialty shops.",
    problem:
      "Service appointments, customer updates, staff schedules and follow-ups often live across disconnected tools.",
    solution:
      "Today, Chasum helps manage appointment scheduling, customer communication, CRM, staff management, payments, reporting, business insights and day-to-day business operations—with Summer available for AI reception support in Early Access. Industry-specific automotive workflows continue to evolve.",
    types: [
      "Collision Repair Centres",
      "Auto Body Shops",
      "Mechanical Repair Shops",
      "Dealership Service Departments",
      "Tire & Wheel Centres",
      "Oil Change & Maintenance",
      "Vehicle Detailing",
      "Glass Repair",
      "EV Service Centres",
      "Fleet Maintenance",
      "Performance Shops",
      "Inspection & Safety Centres",
    ],
    modules: [
      "Scheduling & Reception",
      "CRM",
      "Team & Locations",
      "Communication",
      "Payments",
      "Commerce & Reporting",
    ],
    note: "Chasum is business operations software for automotive service teams. Specialized capabilities such as estimating, repair management, inventory, OEM integrations, VIN decoding, warranty processing and parts management must be assessed separately unless those capabilities are intentionally built and verified.",
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Professional Services",
    intro:
      "Designed for professional practices that need polished appointments, client relationships and everyday business operations.",
    problem:
      "Consultants and advisors need clear booking and follow-up without a clinic-sized stack.",
    solution:
      "Today, Chasum helps manage appointments, CRM, communication, reporting and business operations under Private Alpha founding plans. Industry-specific professional workflows continue to evolve.",
    types: [
      "Accountants",
      "Financial Advisors",
      "Consultants",
      "Architects",
      "Engineers",
      "Business Advisors",
    ],
    modules: [
      "Scheduling & Reception",
      "CRM",
      "Reports",
      "Commerce",
    ],
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Photography & Creative",
    intro:
      "Designed for photography studios, videographers, creative agencies and content creators.",
    problem:
      "Sessions, deposits and client communication live in inboxes.",
    solution:
      "Today, Chasum helps manage session appointments, CRM, deposits, communication and reporting without inventing availability. Industry-specific creative workflows continue to evolve.",
    types: [
      "Photography Studios",
      "Videographers",
      "Creative Agencies",
      "Content Creators",
    ],
    modules: [
      "Scheduling & Reception",
      "CRM",
      "Commerce",
      "Reports",
    ],
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Pet Services",
    intro:
      "Designed for veterinary clinics, grooming, daycare, boarding and training businesses.",
    problem:
      "Recurring visits and customer notes get lost between bookings.",
    solution:
      "Today, Chasum helps manage appointments, CRM, reminders, communication and customer care—with Summer available for AI reception support in Early Access. Industry-specific pet-care workflows continue to evolve.",
    types: [
      "Veterinary Clinics",
      "Pet Grooming",
      "Pet Daycare",
      "Pet Boarding",
      "Dog Training",
    ],
    modules: [
      "CRM",
      "Scheduling & Reception",
      "Communication",
      "AI Assistance",
    ],
    status: "Private Alpha · Available Today foundations",
  },
  {
    name: "Cleaning",
    intro:
      "Designed for commercial, office, residential and janitorial cleaning teams.",
    problem:
      "Recurring routes and last-minute changes overwhelm the schedule.",
    solution:
      "Today, Chasum helps manage appointments, scheduling, waitlists, staff coordination and reporting so day-of changes are easier to handle. Industry-specific cleaning workflows continue to evolve.",
    types: [
      "Commercial Cleaning",
      "Office Cleaning",
      "Residential Cleaning",
      "Janitorial Services",
    ],
    modules: [
      "Scheduling & Reception",
      "Team & Locations",
      "Reports",
    ],
    status: "Private Alpha · Available Today foundations",
  },
] as const;

export const CUSTOMER_JOURNEY = [
  {
    step: "1",
    title: "Appointment requested",
    detail: "Online booking or reception begins the visit.",
  },
  {
    step: "2",
    title: "Availability confirmed",
    detail: "Chasum checks the scheduling rules and real availability.",
  },
  {
    step: "3",
    title: "Customer record updated",
    detail: "CRM history and context remain connected to the appointment.",
  },
  {
    step: "4",
    title: "Confirmation and reminder sent",
    detail:
      "Configured email or SMS channels keep the customer informed.",
  },
  {
    step: "5",
    title: "Service completed",
    detail: "The appointment progresses through the business’s chosen workflow.",
  },
  {
    step: "6",
    title: "Payment recorded",
    detail:
      "Deposits, partial payments, gift certificates and final balances enter the commerce ledger where supported.",
  },
  {
    step: "7",
    title: "Reports updated",
    detail:
      "Operational and financial reporting reflects the recorded activity.",
  },
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
    specialty: "Website concierge, product guide, reception assist",
    status: "Early Access",
    availability: "Early Access",
    summary:
      "Helps visitors explore Chasum and assists with grounded business questions and booking workflows where configured.",
  },
  {
    name: "Chase",
    role: "AI Operations Insights",
    specialty: "Read-only operational summaries",
    status: "Early Access",
    availability: "Early Access",
    summary:
      "Surfaces read-only operational observations and summaries from business activity where implemented.",
  },
  {
    name: "Alex",
    role: "AI Scheduling",
    specialty: "Calendar optimization",
    status: "Coming Next",
    availability: "Coming Next",
    summary:
      "Protects the calendar and coordinates availability without inventing times.",
  },
  {
    name: "Maya",
    role: "Marketing Intelligence",
    specialty: "Customer outreach",
    status: "Future Vision",
    availability: "Future Vision",
    summary:
      "Prepares owner-approved campaigns and thoughtful follow-up without spam.",
  },
  {
    name: "Leo",
    role: "Business Advisor",
    specialty: "Performance insights",
    status: "Future Vision",
    availability: "Future Vision",
    summary:
      "Turns operational signals into clear summaries and practical next steps.",
  },
  {
    name: "Sophia",
    role: "Customer Success",
    specialty: "Customer care",
    status: "Future Vision",
    availability: "Future Vision",
    summary:
      "Coordinates preparation, follow-up and relationship care after booking.",
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
    a: "Chasum is the AI Business Operating System for service businesses—one platform that connects scheduling, customers, teams, communication, payments and reporting, with AI assistance designed to work alongside your team.",
  },
  {
    q: "Is Chasum Just Another Booking Page?",
    a: "No. Public booking is one surface. The product includes Reception, CRM, team and location configuration, reports, communication, commerce tools, and Summer — Chasum's AI Business Assistant (Early Access).",
  },
  {
    q: "Does AI Invent Appointment Times?",
    a: "No. Chasum’s scheduling engine checks the business’s configured hours, services, employees, locations and existing bookings. If there are no openings, Chasum shows empty — it does not invent times.",
  },
  {
    q: "What is available during Private Alpha?",
    a: "Design partners can use Available Today foundations such as calendar and booking, public booking, CRM, employees, multi-location configuration, reports, and configured messaging. Summer and Chase are Early Access. Public self-serve checkout is Coming Next.",
  },
  {
    q: "What is Early Access?",
    a: "Early Access means a capability is real and usable with design partners, but still evolving. It is labelled clearly so it is never presented as finished or enterprise-complete.",
  },
  {
    q: "Does Chasum replace my existing software immediately?",
    a: "Not necessarily. Many partners start with scheduling, CRM and reporting while keeping other tools during transition. We configure around the workflows currently supported—not a forced overnight cutover.",
  },
  {
    q: "Can Chasum migrate my existing data?",
    a: "Migration support is discussed during onboarding for design partners. Scope depends on your current systems and the data you need to bring across. We do not promise automated one-click migration for every tool.",
  },
  {
    q: "What support do design partners receive?",
    a: "Direct founder access, guided onboarding, and priority responses from the people building the product. Production-critical guarantees require a separate written agreement.",
  },
  {
    q: "Is Chasum an electronic medical record?",
    a: "No. Chasum is business operations software. Healthcare-specific regulatory and clinical-record requirements must be assessed separately and are not claimed as included features.",
  },
  {
    q: "How is AI used today?",
    a: "Summer helps visitors explore Chasum and assists with grounded business questions and booking workflows where configured. Chase surfaces read-only operational observations and summaries where implemented. Additional AI roles are Coming Next or Future Vision.",
  },
  {
    q: "What happens when Summer does not know the answer?",
    a: "She escalates to a human rather than inventing facts or availability. Grounded answers come from configured business information and real scheduling data.",
  },
  {
    q: "Can I Run Multiple Locations?",
    a: "Yes. The platform supports single-location through multi-location operations with location scope across calendar, services, staff, and reports, within plan limits.",
  },
  {
    q: "How Do I Get Access During Private Alpha?",
    a: "Apply for Private Alpha. We onboard a limited number of design partners with founder support. Public self-serve checkout is Coming Next.",
  },
  {
    q: "How Does Summer Work Today?",
    a: "Summer — Chasum's AI Business Assistant (Early Access) — answers from your configured hours, services, employees, and locations; recommends real slots; starts the booking flow; and escalates to staff when needed. On the marketing site she also acts as website concierge and product guide.",
  },
  {
    q: "Do You Support Google, Outlook, and Apple Calendars?",
    a: "Google and Microsoft/Outlook can optionally inform busy-time conflict detection when configured. Apple Calendar support today is via ICS subscribe—not full two-way OAuth sync. Chasum remains the system of record for bookings.",
  },
  {
    q: "Is My Business Data Isolated from Other Customers?",
    a: "Yes. Each business operates in its own protected workspace, supported by tenant-level access controls in the database. Your data is not shared across tenants.",
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
