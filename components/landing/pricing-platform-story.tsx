import {
  PRICING_PLATFORM_BODY,
  PRICING_PLATFORM_EYEBROW,
  PRICING_PLATFORM_FOOTNOTE,
  PRICING_PLATFORM_HEADLINE_LINE_1,
  PRICING_PLATFORM_HEADLINE_LINE_2,
} from "@/lib/marketing/pricing";
import {
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  MapPin,
  MessageSquare,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Nodes reflect Available Today / Early Access foundations only
 * (Product Truth Matrix). No Coming Next / Future Vision roles.
 */
const OUTER_NODES: ReadonlyArray<{
  label: string;
  icon: LucideIcon;
  /** Degrees from center; 0 = right, -90 = top */
  angle: number;
}> = [
  { label: "Bookings", icon: CalendarDays, angle: -90 },
  { label: "Customers", icon: Users, angle: -45 },
  { label: "Communication", icon: MessageSquare, angle: 0 },
  { label: "Staff", icon: UserRound, angle: 45 },
  { label: "Locations", icon: MapPin, angle: 90 },
  { label: "Reports", icon: BarChart3, angle: 135 },
  { label: "Summer", icon: Sparkles, angle: 180 },
  { label: "AI", icon: Bot, angle: -135 },
];

const VIEW_W = 640;
const VIEW_H = 420;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const RADIUS = 148;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + Math.cos(rad) * radius,
    y: CY + Math.sin(rad) * radius,
  };
}

/**
 * Minimal connected-platform constellation for Pricing.
 * Hairline links + line icons — Apple / Stripe / Linear calm, not a dashboard.
 */
export function PricingPlatformConstellation() {
  return (
    <div
      className="mx-auto w-full max-w-3xl"
      role="img"
      aria-label="Bookings, customers, communication, staff, locations, reports, AI, and Summer connected around your business"
    >
      {/* Mobile: calm wrap around the business core */}
      <div className="sm:hidden">
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5">
          {OUTER_NODES.slice(0, 3).map((node) => (
            <MobileNode key={node.label} label={node.label} icon={node.icon} />
          ))}
        </ul>
        <div className="flex justify-center py-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2.5 text-sm font-semibold tracking-tight text-foreground shadow-sm">
            <Building2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Business
          </span>
        </div>
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5">
          {OUTER_NODES.slice(3, 6).map((node) => (
            <MobileNode key={node.label} label={node.label} icon={node.icon} />
          ))}
        </ul>
        <ul className="mt-5 grid grid-cols-2 justify-items-center gap-x-8">
          {OUTER_NODES.slice(6).map((node) => (
            <MobileNode key={node.label} label={node.label} icon={node.icon} />
          ))}
        </ul>
      </div>

      {/* sm+: constellation */}
      <div
        className="relative mx-auto hidden aspect-[640/420] w-full sm:block"
        style={{ maxWidth: VIEW_W }}
      >
        <svg
          className="absolute inset-0 h-full w-full text-foreground"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            className="stroke-border"
            strokeWidth={1}
            strokeOpacity={0.4}
            strokeDasharray="2 10"
          />
          {OUTER_NODES.map((node) => {
            const p = polar(node.angle, RADIUS);
            return (
              <line
                key={`line-${node.label}`}
                x1={CX}
                y1={CY}
                x2={p.x}
                y2={p.y}
                className="stroke-border"
                strokeWidth={1}
              />
            );
          })}
        </svg>

        <div
          className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-full border border-border/80 bg-card px-5 py-4 shadow-sm"
        >
          <Building2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-semibold tracking-tight text-foreground">
            Business
          </span>
        </div>

        {OUTER_NODES.map((node) => {
          const p = polar(node.angle, RADIUS);
          const Icon = node.icon;
          const left = `${(p.x / VIEW_W) * 100}%`;
          const top = `${(p.y / VIEW_H) * 100}%`;
          return (
            <div
              key={node.label}
              className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left, top }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card shadow-sm">
                <Icon
                  className="h-3.5 w-3.5 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </span>
              <span className="whitespace-nowrap text-[11px] font-medium tracking-tight text-muted-foreground">
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileNode({
  label,
  icon: Icon,
}: {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-card">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </span>
      <span className="text-[11px] font-medium tracking-tight text-muted-foreground">
        {label}
      </span>
    </li>
  );
}

/**
 * Emotional bridge between plan cards and the comparison table.
 * Storytelling only — not another feature or pricing list.
 */
export function PricingPlatformStory() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="marketing-eyebrow">{PRICING_PLATFORM_EYEBROW}</p>
      <h2
        id="pricing-platform-heading"
        className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
      >
        <span className="block">{PRICING_PLATFORM_HEADLINE_LINE_1}</span>
        <span className="block">{PRICING_PLATFORM_HEADLINE_LINE_2}</span>
      </h2>
      <p className="marketing-lede mx-auto mt-5 max-w-xl">
        {PRICING_PLATFORM_BODY}
      </p>

      <div className="mt-14 md:mt-16">
        <PricingPlatformConstellation />
      </div>

      <p className="mx-auto mt-12 max-w-md text-sm leading-relaxed text-muted-foreground md:mt-14 md:text-base">
        {PRICING_PLATFORM_FOOTNOTE}
      </p>
    </div>
  );
}
