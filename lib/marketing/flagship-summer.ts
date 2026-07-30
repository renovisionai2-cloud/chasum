/**
 * Flagship Meet Summer — creative direction copy & discovery options.
 * Engines reused: Discovery, Knowledge, Session Memory, Provider Registry.
 */

export const FS_HERO = {
  brand: "Meet Summer",
  headline: "The Intelligence Behind Every Business Decision.",
  micro: [
    "Summer doesn't replace people.",
    "She understands businesses.",
    "She learns.",
    "She recommends.",
    "She remembers.",
  ],
  cta: "Begin the Experience",
  ctaHint:
    "A two-minute introduction to Summer — Chasum's AI Business Manager.",
} as const;

export const FS_AWAKENING = {
  greeting: "Welcome. I'm Summer, your AI Business Manager.",
  body: "I'll help you set up Chasum, recommend the right tools, and guide you as your business grows. Let's start by learning a little about your business.",
  /** @deprecated Prefer greeting + body; kept for any legacy readers */
  lines: [
    "Welcome. I'm Summer, your AI Business Manager.",
    "I'll help you set up Chasum, recommend the right tools, and guide you as your business grows. Let's start by learning a little about your business.",
  ],
} as const;

/** Guided discovery copy & fast pacing */
export const FS_GUIDED = {
  question: "What type of business are you setting up?",
  questionWhy:
    "Every business runs differently — the right recommendation starts with knowing yours.",
  questionHelps:
    "Your answer lets me speak your industry's language instead of generic software talk.",
  questionWillDo:
    "I'll use it to load relevant patterns, then ask only what still matters — one question at a time.",
  continuePrompt:
    "A few more details will help me advise you with precision.",
  backToCategories: "← Back to Categories",
  continueWithSelections: "Continue with my selections",
  addAnotherBusiness: "Add another business",
  chooseAnotherCategory: "Choose from another category",
  selectedSummary: "Your businesses",
  industryPrompt: "Choose one or more categories. You can always update them later.",
  /**
   * TODO(summer-onboarding): Respond dynamically as the user selects categories.
   * Examples (do not implement yet):
   * - Healthcare: "Great! I'll tailor Chasum for your healthcare practice."
   * - Home Services: "Perfect! I'll recommend tools for scheduling technicians, estimates, invoicing, and customer communication."
   * - Beauty: "Excellent! I'll help you manage appointments, staff schedules, payments, memberships, and client communication."
   * - Automotive: "Great! I'll configure Chasum for repair orders, estimates, inspections, invoicing, and customer updates."
   * Conversational onboarding acknowledgment will be implemented later.
   */
  introFadeMs: 520,
  /** Pause after greeting, before categories appear */
  readyMs: 1100,
  /** Soft stagger between category cards */
  categoryStaggerMs: 70,
  /** Industry panel reveal */
  industryRevealMs: 220,
  intelligenceSteps: [
    "Understanding your business…",
    "Loading industry knowledge…",
    "Connecting common workflows…",
    "Analyzing operational challenges…",
    "Preparing personalized questions…",
    "Ready.",
  ],
} as const;

export type FsSelectedBusiness = {
  id: string;
  label: string;
  prompt: string;
  categoryId: string;
};

export function fsBuildMultiAck(labels: string[]): string {
  const clean = labels.map((l) => l.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) {
    const article = /^[aeiou]/i.test(clean[0]!) ? "an" : "a";
    return `Thanks. I understand that you operate ${article} ${clean[0]} business. That helps me tailor the next questions to your workflow.`;
  }
  if (clean.length === 2) {
    return `Thanks. I understand that you operate both a ${clean[0]} and a ${clean[1]} business. That helps me tailor the next questions across both workflows.`;
  }
  const last = clean[clean.length - 1];
  const rest = clean.slice(0, -1).join(", ");
  return `Thanks. I understand that you operate ${rest}, and a ${last}. That helps me tailor the next questions across those workflows.`;
}

export function fsBuildMultiPrompt(selections: FsSelectedBusiness[]): string {
  const labels = selections.map((s) => s.label);
  if (labels.length === 0) return "";
  if (labels.length === 1) {
    return `${selections[0]!.prompt}. Please personalize your guidance for this business.`;
  }
  if (labels.length === 2) {
    return `I operate both a ${labels[0]} and a ${labels[1]} business. Please personalize your guidance across both workflows.`;
  }
  return `I operate these businesses: ${labels.join(", ")}. Please personalize your guidance across those workflows.`;
}

export function fsAckBusinessLine(label: string): string {
  const trimmed = label.trim();
  if (/^other\b/i.test(trimmed)) {
    return "You run an appointment-based business.";
  }
  const startsWithVowel = /^[aeiou]/i.test(trimmed);
  const article = startsWithVowel ? "an" : "a";
  return `You run ${article} ${trimmed}.`;
}

export function fsAckDifferenceLine(label: string): string {
  if (/clinic|practice|optometr|dental|chiro|physio|osteopath|psycholog|counsell|veterinar/i.test(label)) {
    return "Every clinic is different.";
  }
  if (/salon|spa|studio|barber/i.test(label)) {
    return "Every studio is different.";
  }
  return "Every business is different.";
}

/** @deprecated Single-industry ack — prefer fsBuildMultiAck */
export function fsBuildAckLines(label: string): string[] {
  return [
    fsAckBusinessLine(label).replace(/^You run/, "So you're running"),
    "That already tells me a lot about how your days work.",
    fsAckDifferenceLine(label),
    "Before I recommend anything, I want to understand what makes yours unique.",
  ];
}

export type FsBusinessIndustry = {
  id: string;
  label: string;
  /** Natural-language prompt fed to the existing Discovery Engine via send() */
  prompt: string;
};

export type FsBusinessCategory = {
  id: string;
  label: string;
  /** Short path description for floating category cards */
  blurb: string;
  industries: readonly FsBusinessIndustry[];
};

/**
 * Phase 9 — floating path cards for Business Discovery.
 * Prompts stay natural language so Session Memory / extractors work unchanged.
 */
export const FS_BUSINESS_CATEGORIES: readonly FsBusinessCategory[] = [
  {
    id: "healthcare",
    label: "Healthcare",
    blurb: "Clinics · Dental · Medical · Veterinary",
    industries: [
      { id: "ultrasound", label: "Ultrasound", prompt: "I run an ultrasound clinic" },
      { id: "medical_clinic", label: "Medical Clinic", prompt: "I run a medical clinic" },
      { id: "family_practice", label: "Family Practice", prompt: "I run a family practice clinic" },
      { id: "walk_in_clinic", label: "Walk-in Clinic", prompt: "I run a walk-in clinic" },
      { id: "dental", label: "Dental", prompt: "I run a dental practice" },
      { id: "chiropractic", label: "Chiropractic", prompt: "I run a chiropractic practice" },
      { id: "physiotherapy", label: "Physiotherapy", prompt: "I run a physiotherapy clinic" },
      { id: "massage_therapy", label: "Massage Therapy", prompt: "I run a massage therapy business" },
      { id: "osteopathy", label: "Osteopathy", prompt: "I run an osteopathy clinic" },
      {
        id: "psychology_counselling",
        label: "Psychology / Counselling",
        prompt: "I run a psychology counselling practice",
      },
      { id: "optometry", label: "Optometry", prompt: "I run an optometry clinic" },
      { id: "veterinary_healthcare", label: "Veterinary", prompt: "I run a veterinary clinic" },
    ],
  },
  {
    id: "beauty",
    label: "Beauty & Personal Care",
    blurb: "Salons · Spa · Barber · Nails",
    industries: [
      { id: "hair_salon", label: "Hair Salon", prompt: "I run a hair salon" },
      { id: "barber_shop", label: "Barber Shop", prompt: "I run a barber shop" },
      { id: "spa", label: "Spa", prompt: "I run a spa" },
      { id: "medical_spa", label: "Medical Spa", prompt: "I run a medical spa" },
      { id: "nail_salon", label: "Nail Salon", prompt: "I run a nail salon" },
      { id: "lash_studio", label: "Lash Studio", prompt: "I run a lash studio" },
      { id: "brow_studio", label: "Brow Studio", prompt: "I run a brow studio" },
      { id: "tattoo_studio", label: "Tattoo Studio", prompt: "I run a tattoo studio" },
    ],
  },
  {
    id: "fitness",
    label: "Fitness & Wellness",
    blurb: "Gym · Training · Yoga · Pilates",
    industries: [
      { id: "gym", label: "Gym", prompt: "I run a gym" },
      {
        id: "personal_trainer",
        label: "Personal Trainer",
        prompt: "I run a personal training business",
      },
      { id: "yoga_studio", label: "Yoga Studio", prompt: "I run a yoga studio" },
      { id: "pilates_studio", label: "Pilates Studio", prompt: "I run a pilates studio" },
      { id: "fitness_studio", label: "Fitness Studio", prompt: "I run a fitness studio" },
    ],
  },
  {
    id: "pet",
    label: "Pet Services",
    blurb: "Veterinary · Grooming · Training · Daycare",
    industries: [
      { id: "veterinary_pet", label: "Veterinary", prompt: "I run a veterinary clinic" },
      { id: "pet_grooming", label: "Pet Grooming", prompt: "I run a pet grooming business" },
      { id: "dog_training", label: "Dog Training", prompt: "I run a dog training business" },
      { id: "pet_daycare", label: "Pet Daycare", prompt: "I run a pet daycare" },
    ],
  },
  {
    id: "automotive",
    label: "Automotive",
    blurb: "Repair · Collision · Detailing · Tires",
    industries: [
      { id: "auto_repair", label: "Auto Repair", prompt: "I run an auto repair shop" },
      {
        id: "collision_repair",
        label: "Collision Repair",
        prompt: "I run a collision repair shop",
      },
      { id: "auto_detailing", label: "Auto Detailing", prompt: "I run an auto detailing business" },
      { id: "tire_shop", label: "Tire Shop", prompt: "I run a tire shop" },
    ],
  },
  {
    id: "home",
    label: "Home Services",
    blurb: "Cleaning · HVAC · Plumbing · Electrical",
    industries: [
      { id: "cleaning", label: "Cleaning Service", prompt: "I run a cleaning service" },
      { id: "hvac", label: "HVAC", prompt: "I run an HVAC business" },
      { id: "plumbing", label: "Plumbing", prompt: "I run a plumbing business" },
      { id: "electrical", label: "Electrical", prompt: "I run an electrical service business" },
      { id: "landscaping", label: "Landscaping", prompt: "I run a landscaping business" },
      { id: "painting", label: "Painting", prompt: "I run a painting business" },
    ],
  },
  {
    id: "professional",
    label: "Professional Services",
    blurb: "Accounting · Law · Real Estate · Consulting",
    industries: [
      { id: "law_firm", label: "Law Firm", prompt: "I run a law firm" },
      { id: "accounting", label: "Accounting", prompt: "I run an accounting practice" },
      { id: "insurance", label: "Insurance", prompt: "I run an insurance agency" },
      { id: "real_estate", label: "Real Estate", prompt: "I run a real estate office" },
      { id: "consulting", label: "Consulting", prompt: "I run a consulting business" },
    ],
  },
  {
    id: "creative",
    label: "Photography & Creative",
    blurb: "Photo · Video · Photo Booth",
    industries: [
      {
        id: "photography_studio",
        label: "Photography Studio",
        prompt: "I run a photography studio",
      },
      {
        id: "videography_studio",
        label: "Videography Studio",
        prompt: "I run a videography studio",
      },
      {
        id: "photo_booth",
        label: "Photo Booth Rental",
        prompt: "I run a photo booth rental business",
      },
    ],
  },
  {
    id: "education",
    label: "Education",
    blurb: "Tutoring · Music · Driving · Training",
    industries: [
      { id: "tutoring", label: "Tutoring Centre", prompt: "I run a tutoring centre" },
      { id: "music_school", label: "Music School", prompt: "I run a music school" },
      { id: "driving_school", label: "Driving School", prompt: "I run a driving school" },
      { id: "training_centre", label: "Training Centre", prompt: "I run a training centre" },
    ],
  },
  {
    id: "other",
    label: "Other",
    blurb: "Appointment-based businesses",
    industries: [
      {
        id: "other",
        label: "Other Appointment-Based Business",
        prompt: "I run an appointment-based service business",
      },
    ],
  },
] as const;

/** Flat industry list (legacy consumers / tests). */
export const FS_BUSINESS_TYPES = FS_BUSINESS_CATEGORIES.flatMap(
  (category) => category.industries,
);

export const FS_THINKING_STEPS = [
  "Understanding your business…",
  "Loading industry knowledge…",
  "Connecting common workflows…",
  "Analyzing operational challenges…",
  "Preparing personalized questions…",
  "Ready.",
] as const;

export const FS_REASONING_STEPS = [
  "Understanding appointment volume…",
  "Comparing industry benchmarks…",
  "Finding opportunities…",
  "Building recommendations…",
] as const;

export const FS_INTELLIGENCE = [
  {
    traditional: "Traditional software stores appointments.",
    summer: "Summer understands businesses.",
  },
  {
    traditional: "Traditional software creates reports.",
    summer: "Summer explains what changed.",
  },
  {
    traditional: "Traditional software stores customers.",
    summer: "Summer recognizes relationships.",
  },
  {
    traditional: "Traditional software waits.",
    summer: "Summer recommends your next move.",
  },
] as const;

export const FS_ROADMAP = [
  { label: "Today", detail: "AI Website Concierge" },
  { label: "Next", detail: "AI Reception" },
  { label: "Next", detail: "CRM Intelligence" },
  { label: "Next", detail: "Marketing Intelligence" },
  { label: "Next", detail: "Executive AI" },
  { label: "Future", detail: "AI Business Operating System" },
] as const;

export const FS_ALPHA = {
  title: "I think Chasum would be an excellent fit for your business.",
  body: "I'd love your help building the future of AI-powered business management.",
  cta: "Apply for Private Alpha",
} as const;

export const FS_RECS_INTRO = {
  kicker: "Where to begin",
  title: "Where we can create the greatest impact",
  lede: "Based on your Business Profile, here is where I would start.",
} as const;

export const FS_RECOMMENDATION_COPY: Record<
  string,
  { title: string; why: string; tone: "blue" | "purple" | "teal" | "amber" }
> = {
  "ai-reception": {
    title: "AI Reception",
    why: "Because your team currently spends significant time answering calls.",
    tone: "blue",
  },
  crm: {
    title: "CRM Intelligence",
    why: "To strengthen customer relationships with context before every conversation.",
    tone: "purple",
  },
  "revenue-reporting": {
    title: "Executive Reports",
    why: "To help you understand what is changing in your business.",
    tone: "teal",
  },
  reporting: {
    title: "Executive Reports",
    why: "To help you understand what is changing in your business.",
    tone: "teal",
  },
  marketing: {
    title: "Marketing Automation",
    why: "To reach the right clients when the book needs filling.",
    tone: "amber",
  },
  retention: {
    title: "Customer Retention",
    why: "So rebooking becomes a habit — not a chase.",
    tone: "purple",
  },
  deposits: {
    title: "Deposits",
    why: "To protect longer appointments from costly no-shows.",
    tone: "amber",
  },
  "online-booking": {
    title: "Scheduling",
    why: "To fill real openings without inventing availability.",
    tone: "blue",
  },
  calendar: {
    title: "Scheduling",
    why: "Because a dependable book is the foundation for everything else.",
    tone: "blue",
  },
  "staff-scheduling": {
    title: "Staff Scheduling",
    why: "To match demand to who is on the floor.",
    tone: "teal",
  },
};

export const FS_DEFAULT_RECS = [
  "ai-reception",
  "crm",
  "revenue-reporting",
  "marketing",
] as const;
