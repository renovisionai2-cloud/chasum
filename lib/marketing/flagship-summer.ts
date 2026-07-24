/**
 * Flagship Meet Summer — creative direction copy & discovery options.
 * Engines reused: Discovery, Knowledge, Session Memory, Provider Registry.
 */

export const FS_HERO = {
  brand: "Meet Summer",
  headline: "The Intelligence Behind Every Business Decision.",
  support:
    "Summer doesn't manage appointments.\nSummer understands businesses.",
  cta: "Begin the Experience",
} as const;

export const FS_AWAKENING = {
  lines: [
    "Welcome.",
    "I'm Summer.",
    "Before I recommend software…",
    "I'd like to understand your business.",
  ],
} as const;

export const FS_BUSINESS_TYPES = [
  { id: "ultrasound", label: "Ultrasound", prompt: "I run an ultrasound clinic" },
  { id: "salon", label: "Salon", prompt: "I run a salon" },
  { id: "spa", label: "Spa", prompt: "I run a spa" },
  { id: "massage", label: "Massage", prompt: "I run a massage business" },
  { id: "chiropractic", label: "Chiropractic", prompt: "I run a chiropractic practice" },
  { id: "dental", label: "Dental", prompt: "I run a dental practice" },
  { id: "veterinary", label: "Veterinary", prompt: "I run a veterinary clinic" },
  { id: "fitness", label: "Fitness", prompt: "I run a fitness studio" },
  { id: "pet_grooming", label: "Pet Grooming", prompt: "I run a pet grooming business" },
  { id: "other", label: "Other", prompt: "I run an appointment-based service business" },
] as const;

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
