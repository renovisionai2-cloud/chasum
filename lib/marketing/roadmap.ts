/**
 * Public Roadmap — business-owner narrative (not developer release notes).
 * Inspired by Product Truth; written for clarity and confidence.
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
    | "phone"
    | "sms"
    | "inventory"
    | "payroll"
    | "campaigns"
    | "memberships"
    | "mobile"
    | "insights"
    | "locations"
    | "franchise"
    | "automation"
    | "loyalty"
    | "marketplace";
};

export const ROADMAP_AVAILABLE_TODAY = {
  title: "Available Today",
  subtitle:
    "Everything below is already available or actively shipping inside Chasum.",
  cards: [
    {
      title: "Online Booking",
      detail: "Customers can book appointments anytime.",
      icon: "booking",
    },
    {
      title: "Calendar & Scheduling",
      detail: "Manage staff schedules from one place.",
      icon: "calendar",
    },
    {
      title: "Customer Management",
      detail: "Build stronger relationships with every customer.",
      icon: "customers",
    },
    {
      title: "Summer AI Business Manager",
      detail:
        "Your intelligent assistant for onboarding, customer communication, and daily operations.",
      icon: "summer",
    },
    {
      title: "Payments",
      detail: "Accept payments and deposits securely.",
      icon: "payments",
    },
    {
      title: "Gift Cards",
      detail: "Sell and manage gift cards effortlessly.",
      icon: "gift",
    },
    {
      title: "Email Notifications",
      detail: "Keep customers informed automatically.",
      icon: "email",
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
        "Let Summer answer calls, book appointments, answer questions, and assist customers even when your business is closed.",
      icon: "phone",
    },
    {
      title: "Business Text Messaging",
      detail:
        "Send and receive business texts directly inside Chasum.",
      icon: "sms",
    },
    {
      title: "Inventory Management",
      detail:
        "Track products, stock levels, and suppliers without additional software.",
      icon: "inventory",
    },
    {
      title: "Payroll",
      detail: "Simplify employee payroll and compensation.",
      icon: "payroll",
    },
    {
      title: "Marketing Campaigns",
      detail:
        "Email and SMS campaigns that help grow your business.",
      icon: "campaigns",
    },
    {
      title: "Memberships & Packages",
      detail: "Offer recurring memberships and prepaid packages.",
      icon: "memberships",
    },
    {
      title: "Native Mobile Apps",
      detail: "Manage your business from anywhere.",
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
        "Summer analyzes trends and recommends ways to improve your business.",
      icon: "insights",
    },
    {
      title: "Multi-location Management",
      detail: "Operate multiple locations from one platform.",
      icon: "locations",
    },
    {
      title: "Franchise Management",
      detail: "Support growing franchise businesses.",
      icon: "franchise",
    },
    {
      title: "Workflow Automation",
      detail: "Automate repetitive daily tasks.",
      icon: "automation",
    },
    {
      title: "Customer Loyalty",
      detail: "Reward returning customers automatically.",
      icon: "loyalty",
    },
    {
      title: "Marketplace",
      detail:
        "Connect businesses with trusted integrations and services.",
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
