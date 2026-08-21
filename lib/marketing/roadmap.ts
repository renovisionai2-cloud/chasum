/**
 * Public Roadmap — business-owner narrative (not developer release notes).
 * Must stay consistent with approved Pricing inclusions.
 *
 * STATUS: APPROVED · VERSION: Roadmap v1 · STATE: Locked
 * See docs/marketing/ROADMAP_V1_LOCK.md
 */

export const ROADMAP_LAST_REVIEWED = "2026-07-30";

export const ROADMAP_HERO = {
  eyebrow: "Roadmap",
  headline: "Building the Future of Business Management",
  lede: "We're building Chasum alongside real businesses. Every feature on our roadmap is inspired by customer feedback and designed to solve real business challenges—not simply add more features.",
} as const;

export type RoadmapCard = {
  title: string;
  detail: string;
  icon:
    | "booking"
    | "calendar"
    | "customers"
    | "summer"
    | "payments"
    | "gift"
    | "email"
    | "calls"
    | "sms"
    | "phone"
    | "automation"
    | "inventory"
    | "payroll"
    | "campaigns"
    | "memberships"
    | "mobile"
    | "insights"
    | "locations"
    | "franchise"
    | "loyalty"
    | "marketplace";
};

export const ROADMAP_AVAILABLE_TODAY = {
  title: "Available in Chasum Today",
  subtitle:
    "Everything below is available in Chasum today and designed to help you save time, improve customer experiences, and grow your business.",
  cards: [
    {
      title: "Online Booking",
      detail:
        "Fill your calendar around the clock—customers book when it suits them, without phone tag or missed inquiries.",
      icon: "booking",
    },
    {
      title: "Calendar & Scheduling",
      detail:
        "See every appointment and staff schedule in one place so you spend less time coordinating and more time serving customers.",
      icon: "calendar",
    },
    {
      title: "Customer Management",
      detail:
        "Keep every customer's history, preferences, and notes together so your team delivers a more personal experience.",
      icon: "customers",
    },
    {
      title: "Summer AI Business Manager",
      detail:
        "Get help with onboarding, customer communication, and daily operations—so routine work takes less of your time.",
      icon: "summer",
    },
    {
      title: "Payments",
      detail:
        "Collect payments and deposits with less follow-up, fewer no-shows, and clearer cash flow for your business.",
      icon: "payments",
    },
    {
      title: "Gift Cards",
      detail:
        "Turn gift cards into new visits and extra revenue—easy for customers to buy, simple for your team to redeem.",
      icon: "gift",
    },
    {
      title: "Email Notifications",
      detail:
        "Confirmations and reminders go out automatically, reducing no-shows and cutting down on manual follow-up.",
      icon: "email",
    },
    {
      title: "Business Calls & Texting",
      detail:
        "Handle customer calls and texts from one place—so conversations stay organized and nothing slips through the cracks.",
      icon: "calls",
    },
    {
      title: "SMS Reminders",
      detail:
        "Send appointment reminders by text automatically—fewer no-shows, less phone chasing, and a smoother day for your team.",
      icon: "sms",
    },
  ] as const satisfies readonly RoadmapCard[],
} as const;

export const ROADMAP_COMING_SOON = {
  title: "Coming Soon",
  subtitle:
    "These are the next major capabilities we're actively building.",
  cards: [
    {
      title: "AI Phone Calls",
      detail:
        "Never miss a booking opportunity—Summer can answer calls, take appointments, and help customers even after hours.",
      icon: "phone",
    },
    {
      title: "AI Workflow Automation",
      detail:
        "Let Summer automate repetitive business tasks, follow-ups, reminders, and everyday workflows—saving time so your team can focus on customers.",
      icon: "automation",
    },
    {
      title: "Inventory Management",
      detail:
        "Know what's in stock before you run out—fewer surprises, less waste, and no need for a separate inventory tool.",
      icon: "inventory",
    },
    {
      title: "Payroll",
      detail:
        "Pay your team accurately with less spreadsheet work and fewer end-of-pay-period headaches.",
      icon: "payroll",
    },
    {
      title: "Marketing Campaigns",
      detail:
        "Bring customers back and fill slow days with email and text campaigns that grow revenue—not just send messages.",
      icon: "campaigns",
    },
    {
      title: "Memberships & Service Packages",
      detail:
        "Sell recurring memberships and prepaid service packages to increase customer loyalty and create predictable recurring revenue.",
      icon: "memberships",
    },
    {
      title: "Native Mobile Apps",
      detail:
        "Stay on top of bookings, staff, and customers from your phone—so your business keeps running when you're away from the desk.",
      icon: "mobile",
    },
  ] as const satisfies readonly RoadmapCard[],
} as const;

export const ROADMAP_FUTURE_VISION = {
  title: "Future Vision",
  subtitle:
    "This is where we're taking Chasum over the next several years.",
  cards: [
    {
      title: "AI Business Insights",
      detail:
        "See what's working and what to improve next—clear recommendations that help you grow revenue and run smarter.",
      icon: "insights",
    },
    {
      title: "Multi-location Management",
      detail:
        "Run every location from one place with consistent operations, visibility, and less jumping between tools.",
      icon: "locations",
    },
    {
      title: "Franchise Management",
      detail:
        "Scale your brand with shared standards and oversight—so growth doesn't mean losing control of the customer experience.",
      icon: "franchise",
    },
    {
      title: "Workflow Automation",
      detail:
        "Connect the steps of your day-to-day operations so work moves forward without constant manual handoffs.",
      icon: "automation",
    },
    {
      title: "Customer Loyalty",
      detail:
        "Reward return visits automatically and turn one-time customers into regulars who spend more over time.",
      icon: "loyalty",
    },
    {
      title: "Marketplace",
      detail:
        "Add trusted tools and services when you need them—without stitching together a messy stack of separate software.",
      icon: "marketplace",
    },
  ] as const satisfies readonly RoadmapCard[],
} as const;

export const ROADMAP_CLOSING = {
  title: "Built With Our Customers",
  paragraphs: [
    "Every major improvement in Chasum begins with feedback from real business owners.",
    "We don't build features because they're trendy. We build features that save time, reduce repetitive work, improve customer experiences, and help businesses grow.",
    "This roadmap evolves alongside our customers, and we're just getting started.",
  ],
} as const;
