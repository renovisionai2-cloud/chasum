/**
 * Industries page copy — `/industries` only.
 * Taxonomy order matches `INDUSTRIES_PAGE_ORDER`.
 * Education remains a homepage tile; deep-dive is deferred (V2).
 */

export const INDUSTRIES_HERO = {
  eyebrow: "Industries",
  headline: "Built around the way service businesses actually work.",
  lede: "Service businesses share common operating needs, but workflows differ by industry. Chasum is one AI Business Operating System—configured around how your business actually runs, not a separate product for each vertical.",
  bridge:
    "One platform. One memory. One intelligence. Configured for the way your business operates.",
} as const;

export const INDUSTRY_GROWING_STATEMENT =
  "As the business grows, the same operating model can support more people, more locations, richer reporting, and deeper automation—without switching platforms.";

/** Aligned with locked Meet Summer: surface + recommend, human control, no autonomy. */
export const INDUSTRY_SUMMER_LINE =
  "Summer, your AI Business Manager, uses the same operating context to surface what needs attention and recommend what to do next—while you remain in control.";

/** Approved Homepage Private Alpha headline — passed into Industries only. */
export const INDUSTRIES_ALPHA_HEADLINE =
  "Help shape the future of how service businesses operate.";

/** Display at most this many representative-type chips until the visitor expands. */
export const INDUSTRY_TYPES_PREVIEW = 8;

/**
 * Public capability chips. Scheduling may use an industry-native label
 * for the same underlying scheduling capability — not a new product feature.
 */
export const INDUSTRY_CAPABILITY_CATALOG = [
  "Appointment Scheduling",
  "Consultation Scheduling",
  "Session Scheduling",
  "Job Scheduling",
  "Service Scheduling",
  "Customer Records",
  "Employees",
  "Payments",
  "Communications",
  "Reporting",
  "Multi-location",
  "Packages",
  "Memberships",
] as const;

export type IndustryCapability = (typeof INDUSTRY_CAPABILITY_CATALOG)[number];

export type IndustryPageEntry = {
  name: string;
  intro: string;
  distinction: string;
  solution: string;
  types: readonly string[];
  modules: readonly IndustryCapability[];
  status: string;
};

/**
 * Full Industries page order (source of truth).
 * Education is intentionally omitted here — homepage tile only; deep-dive deferred.
 */
export const INDUSTRIES: readonly IndustryPageEntry[] = [
  {
    name: "Medical Clinics",
    intro:
      "Designed for healthcare and wellness practices that run visits, providers, and follow-up in the same day.",
    distinction:
      "Clinical and wellness practices coordinate visits across providers, rooms, customer context, and follow-up—not a generic open slot.",
    solution:
      "Chasum keeps the visit, customer history, provider schedule, and configured reminders on one record. Notes travel with the booking. Clinical records stay in the systems clinics already use.",
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
    ],
    modules: [
      "Appointment Scheduling",
      "Customer Records",
      "Employees",
      "Communications",
      "Payments",
      "Multi-location",
    ],
    status: "Private Alpha",
  },
  {
    name: "Legal Services",
    intro:
      "Designed for legal practices that run consultations, intake, and client follow-up.",
    distinction:
      "Legal work starts with consultations and continues as intake, follow-up, and payment context—not a chair-by-chair book.",
    solution:
      "Chasum connects consultation times, client records, communications, and recorded payments on one record. Practice-management and filing systems stay where they belong.",
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
      "Consultation Scheduling",
      "Customer Records",
      "Communications",
      "Payments",
      "Reporting",
    ],
    status: "Private Alpha",
  },
  {
    name: "Salons",
    intro:
      "Designed for hair salons, barbers, and beauty studios built around busy chairs and repeat clients.",
    distinction:
      "The day is a sequence of staffed services—who can take the next guest, which service, and how often they return.",
    solution:
      "Chasum keeps the book, staff assignment, customer history, reminders, and recorded payments on the same visit. Packages stay on that record where you sell them.",
    types: ["Hair Salons", "Barbers", "Beauty Studios"],
    modules: [
      "Appointment Scheduling",
      "Employees",
      "Customer Records",
      "Payments",
      "Communications",
      "Packages",
    ],
    status: "Private Alpha",
  },
  {
    name: "Spas",
    intro:
      "Designed for medical spas, day spas, wellness centres, and massage studios.",
    distinction:
      "Treatment rooms, therapists, and longer visits need shared, real availability—not one dumped calendar.",
    solution:
      "Chasum coordinates treatment times, staff and room context, client history, and recorded payments. Gift certificates and packages remain on the same customer record where configured.",
    types: [
      "Medical Spas",
      "Day Spas",
      "Wellness Centres",
      "Massage Studios",
    ],
    modules: [
      "Appointment Scheduling",
      "Employees",
      "Customer Records",
      "Payments",
      "Packages",
    ],
    status: "Private Alpha",
  },
  {
    name: "Gyms",
    intro:
      "Designed for gyms, personal trainers, and studio-based fitness businesses.",
    distinction:
      "Sessions, instructors, and recurring plans create an ongoing relationship—not a one-off appointment.",
    solution:
      "Chasum connects sessions, staff schedules, customer records, and recorded payments. Memberships and packages stay attached where the business already sells them.",
    types: [
      "Gyms",
      "Personal Trainers",
      "Yoga Studios",
      "Pilates Studios",
      "Martial Arts Schools",
    ],
    modules: [
      "Session Scheduling",
      "Employees",
      "Customer Records",
      "Payments",
      "Memberships",
      "Packages",
    ],
    status: "Private Alpha",
  },
  {
    name: "Home & Field Services",
    intro:
      "Designed for contractors and field teams coordinating clients, crews, and the day's work.",
    distinction:
      "The work moves between sites. Scheduling, customer updates, and who is assigned matter more than a front-desk chair book.",
    solution:
      "Chasum turns inquiries into scheduled visits and jobs, with customer communication and staff assignment on one record. Quoting and route-planning tools stay separate.",
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
      "Job Scheduling",
      "Customer Records",
      "Employees",
      "Communications",
      "Reporting",
    ],
    status: "Private Alpha",
  },
  {
    name: "Automotive Services",
    intro:
      "Designed for modern automotive service businesses—from collision centres to dealership service departments.",
    distinction:
      "Shops run jobs against bays, technicians, and vehicle history—not a simple personal calendar.",
    solution:
      "Chasum coordinates service appointments, customer updates, service history, and staff schedules on one record. Shop-management and manufacturer systems stay separate.",
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
      "Service Scheduling",
      "Customer Records",
      "Employees",
      "Communications",
      "Payments",
    ],
    status: "Private Alpha",
  },
  {
    name: "Professional Services",
    intro:
      "Designed for advisors and consultants who run clients, consultations, and follow-up from one place.",
    distinction:
      "The work is intake, consultations, and ongoing client context—not a high-volume retail book.",
    solution:
      "Chasum keeps consultations, client records, follow-up, and recorded payments connected. Reporting reflects the same activity. It is not specialized compliance software.",
    types: [
      "Accountants",
      "Financial Advisors",
      "Consultants",
      "Architects",
      "Engineers",
      "Business Advisors",
    ],
    modules: [
      "Consultation Scheduling",
      "Customer Records",
      "Communications",
      "Payments",
      "Reporting",
    ],
    status: "Private Alpha",
  },
  {
    name: "Photography & Creative",
    intro:
      "Designed for photography studios, videographers, and creative teams.",
    distinction:
      "Sessions, deposits, and delivery follow-up define the relationship—not a walk-in chair.",
    solution:
      "Chasum connects session times, client communication, deposits, and the customer record. Reporting reflects recorded activity—not a separate studio-management product.",
    types: [
      "Photography Studios",
      "Videographers",
      "Creative Agencies",
      "Content Creators",
    ],
    modules: [
      "Session Scheduling",
      "Customer Records",
      "Payments",
      "Communications",
    ],
    status: "Private Alpha",
  },
  {
    name: "Pet Services",
    intro:
      "Designed for veterinary clinics, grooming, daycare, boarding, and training businesses.",
    distinction:
      "Recurring visits and animal-plus-owner context drive the day—reminders and history matter as much as the next slot.",
    solution:
      "Chasum keeps recurring visits, customer care, reminders, and recorded payments on one record. Veterinary clinics still need their clinical systems; Chasum runs the operating day.",
    types: [
      "Veterinary Clinics",
      "Pet Grooming",
      "Pet Daycare",
      "Pet Boarding",
      "Dog Training",
    ],
    modules: [
      "Appointment Scheduling",
      "Customer Records",
      "Communications",
      "Payments",
    ],
    status: "Private Alpha",
  },
  {
    name: "Cleaning",
    intro:
      "Designed for commercial, office, residential, and janitorial cleaning teams.",
    distinction:
      "Routes, recurring stops, and last-minute changes matter more than a single studio calendar.",
    solution:
      "Chasum organizes recurring visits and schedule changes with customer communication, staff assignment, and reporting on the same record. Route-planning tools stay separate.",
    types: [
      "Commercial Cleaning",
      "Office Cleaning",
      "Residential Cleaning",
      "Janitorial Services",
    ],
    modules: [
      "Job Scheduling",
      "Customer Records",
      "Employees",
      "Communications",
      "Reporting",
    ],
    status: "Private Alpha",
  },
];
