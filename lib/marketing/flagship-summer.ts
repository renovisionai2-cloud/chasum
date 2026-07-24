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
  ctaHint: "A two-minute introduction to the future of business management.",
} as const;

export const FS_AWAKENING = {
  lines: [
    "Welcome.",
    "I'm Summer.",
    "Before I recommend software…",
    "I'd like to understand your business.",
    "I'll ask one simple question at a time.",
  ],
} as const;

/** Phase 8.1 — guided conversational discovery copy & timing */
export const FS_GUIDED = {
  question: "What type of business do you own?",
  ackLead: "Perfect.",
  ackMore: "Let me learn a little more.",
  /** ms between intro sentences */
  lineGapMs: 900,
  /** pause after last intro line before the question */
  questionPauseMs: 1100,
  /** pause after question before categories begin appearing */
  choicesPauseMs: 750,
  /** stagger between category cards */
  categoryStaggerMs: 100,
  /** pause between acknowledgment lines */
  ackGapMs: 900,
  /** pause after final ack line before sending to Discovery Engine */
  ackCommitMs: 1000,
} as const;

export function fsAckBusinessLine(label: string): string {
  const trimmed = label.trim();
  if (/^other\b/i.test(trimmed)) {
    return "You run an appointment-based business.";
  }
  const startsWithVowel = /^[aeiou]/i.test(trimmed);
  const article = startsWithVowel ? "an" : "a";
  return `You run ${article} ${trimmed}.`;
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
  industries: readonly FsBusinessIndustry[];
};

/**
 * Phase 8 — category accordion for Business Discovery.
 * Prompts stay natural language so Session Memory / extractors work unchanged.
 */
export const FS_BUSINESS_CATEGORIES: readonly FsBusinessCategory[] = [
  {
    id: "healthcare",
    label: "Healthcare",
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
  "Connecting workflows…",
  "Finding opportunities…",
  "Preparing recommendations…",
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
  title: "You've met Summer.",
  body: "If you'd like to help shape the future of AI for service businesses… join our Private Alpha.",
  cta: "Apply for Private Alpha",
} as const;

export const FS_RECOMMENDATION_COPY: Record<
  string,
  { title: string; why: string; tone: "blue" | "purple" | "teal" | "amber" }
> = {
  "ai-reception": {
    title: "AI Reception",
    why: "Cover evenings and overflow so the front desk stays calm.",
    tone: "blue",
  },
  crm: {
    title: "CRM Intelligence",
    why: "Keep relationships warm with context before every conversation.",
    tone: "purple",
  },
  "revenue-reporting": {
    title: "Business Reports",
    why: "See what changed — and what it means for the week ahead.",
    tone: "teal",
  },
  reporting: {
    title: "Business Reports",
    why: "Turn numbers into judgment instead of another spreadsheet.",
    tone: "teal",
  },
  marketing: {
    title: "Marketing Automation",
    why: "Reach the right clients when the book needs filling.",
    tone: "amber",
  },
  retention: {
    title: "Customer Retention",
    why: "Rebooking becomes a habit — not a chase.",
    tone: "purple",
  },
  deposits: {
    title: "Deposits",
    why: "Protect longer appointments from costly no-shows.",
    tone: "amber",
  },
  "online-booking": {
    title: "Scheduling",
    why: "Fill real openings without inventing availability.",
    tone: "blue",
  },
  calendar: {
    title: "Scheduling",
    why: "A dependable book is the foundation for everything else.",
    tone: "blue",
  },
  "staff-scheduling": {
    title: "Staff Scheduling",
    why: "Match demand to who is on the floor.",
    tone: "teal",
  },
};

export const FS_DEFAULT_RECS = [
  "ai-reception",
  "crm",
  "revenue-reporting",
  "marketing",
] as const;
