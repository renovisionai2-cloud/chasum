"use client";

import { Spark } from "@/components/brand/spark";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const NAV = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Reception", icon: Calendar },
  { label: "CRM", icon: Users },
  { label: "Business", icon: Building2 },
  { label: "Employees", icon: UserCog },
  { label: "Reports", icon: BarChart3 },
  { label: "Communication", icon: MessageSquareText },
  { label: "Billing", icon: CreditCard },
  { label: "AI Workforce", icon: Sparkles },
] as const;

const WEEK_BASE = [6, 9, 7, 11, 10, 5, 2];
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type DashboardPreviewProps = {
  className?: string;
  variant?:
    | "overview"
    | "reception"
    | "crm"
    | "reports"
    | "summer"
    | "employees"
    | "business"
    | "communication"
    | "billing";
  compact?: boolean;
  animated?: boolean;
  /** Larger product stage for the marketing hero. */
  hero?: boolean;
  /** Enable live micro-demos inside panes. Defaults to true when not compact. */
  live?: boolean;
};

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
}

function useTick(enabled: boolean, intervalMs: number) {
  const [tick, setTick] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!enabled || reduced) return;
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, reduced]);
  return reduced ? 0 : tick;
}

/** Presentational mirror of the real Chasum dashboard — marketing only, no live data. */
export function DashboardPreview({
  className,
  variant = "overview",
  compact = false,
  animated = false,
  hero = false,
  live,
}: DashboardPreviewProps) {
  const isLive = live ?? !compact;

  return (
    <div
      className={cn(
        "overflow-hidden border border-border/80 bg-card transition-[transform,box-shadow,border-color] duration-500",
        hero
          ? "rounded-[1.35rem] border-0 bg-transparent shadow-none"
          : "marketing-preview-enter rounded-[var(--radius-lg)] shadow-lg",
        animated && !hero && "marketing-dashboard-float",
        className,
      )}
      role="img"
      aria-label="Chasum interactive dashboard demo"
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border/70",
          hero
            ? "bg-white/55 px-5 py-3 backdrop-blur-xl dark:bg-white/5"
            : "bg-muted/50 px-4 py-2.5",
        )}
      >
        <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span
          className={cn(
            "ml-2 truncate text-muted-foreground",
            hero ? "text-[11px] tracking-wide" : "text-xs",
          )}
        >
          app.chasum.com/dashboard{variant === "overview" ? "" : `/${variant}`}
        </span>
        {isLive ? (
          <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success sm:inline-flex">
            <span className="marketing-live-dot h-1.5 w-1.5 rounded-full bg-success" />
            Live
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "flex",
          compact
            ? "min-h-[220px]"
            : hero
              ? "min-h-[340px] sm:min-h-[420px] md:min-h-[520px] lg:min-h-[580px] xl:min-h-[640px]"
              : "min-h-[360px] md:min-h-[480px]",
        )}
      >
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border/70 sm:block",
            hero ? "w-52 bg-muted/30 p-4" : "w-44 bg-muted/20 p-3",
          )}
        >
          <p
            className={cn(
              "mb-3 px-2 font-semibold uppercase tracking-wide text-muted-foreground",
              hero ? "text-[11px]" : "text-[10px]",
            )}
          >
            Chasum
          </p>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                (variant === "overview" && item.label === "Overview") ||
                (variant === "reception" && item.label === "Reception") ||
                (variant === "crm" && item.label === "CRM") ||
                (variant === "reports" && item.label === "Reports") ||
                (variant === "employees" && item.label === "Employees") ||
                (variant === "business" && item.label === "Business") ||
                (variant === "communication" &&
                  item.label === "Communication") ||
                (variant === "billing" && item.label === "Billing") ||
                (variant === "summer" && item.label === "AI Workforce");
              return (
                <li
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs transition-colors duration-300",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className={hero ? "h-4 w-4" : "h-3.5 w-3.5"} />
                  {item.label}
                </li>
              );
            })}
          </ul>
        </aside>

        <div
          className={cn(
            "relative min-w-0 flex-1 overflow-hidden",
            hero ? "bg-background/40 p-5 md:p-6" : "p-4 md:p-5",
          )}
          key={variant}
        >
          <div className="marketing-pane-fade">
            {variant === "overview" ? (
              <OverviewPane compact={compact} live={isLive} hero={hero} />
            ) : null}
            {variant === "reception" ? <ReceptionPane live={isLive} /> : null}
            {variant === "crm" ? <CrmPane live={isLive} /> : null}
            {variant === "communication" ? (
              <CommunicationPane live={isLive} />
            ) : null}
            {variant === "reports" ? <ReportsPane live={isLive} /> : null}
            {variant === "billing" ? <BillingPane live={isLive} /> : null}
            {variant === "summer" ? <SummerPane live={isLive} /> : null}
            {variant === "employees" ? <EmployeesPane live={isLive} /> : null}
            {variant === "business" ? <BusinessPane live={isLive} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewPane({
  compact,
  live,
  hero = false,
}: {
  compact?: boolean;
  live: boolean;
  hero?: boolean;
}) {
  const tick = useTick(live, 2200);
  const revenue = 1.6 + (tick % 5) * 0.12;
  const appointments = 10 + (tick % 6);
  const week = WEEK_BASE.map((v, i) => v + ((tick + i) % 3));
  const showToast = live && tick > 0 && tick % 3 === 0;

  return (
    <div className={cn("space-y-4", hero && "space-y-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Good morning · My Business</p>
          <p
            className={cn(
              "font-semibold tracking-tight",
              hero ? "text-xl md:text-2xl" : "text-lg md:text-xl",
            )}
          >
            Run today from one operating system
          </p>
        </div>
        {showToast ? (
          <div className="marketing-toast flex max-w-[12rem] items-start gap-2 rounded-2xl border border-border/60 bg-background/90 px-3 py-2.5 shadow-lg backdrop-blur-md">
            <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-[11px] leading-snug text-muted-foreground">
              New booking · Alex Rivera · 3:30
            </p>
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          "grid gap-3",
          hero ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {[
          {
            title: "Today",
            value: String(appointments),
            hint: "Appointments",
          },
          {
            title: "Revenue",
            value: `$${revenue.toFixed(1)}k`,
            hint: "Completed today",
          },
          { title: "This Week", value: "54", hint: "Active bookings" },
          { title: "Clients", value: "286", hint: "+18 this month" },
        ].map((stat) => (
          <div
            key={stat.title}
            className={cn(
              "border border-border/60 bg-background/80",
              hero
                ? "rounded-2xl p-4 shadow-sm shadow-black/[0.03]"
                : "rounded-[var(--radius-md)] p-3",
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {stat.title}
            </p>
            <p
              className={cn(
                "mt-1 font-semibold tabular-nums transition-all duration-500",
                hero ? "text-3xl" : "text-2xl",
              )}
            >
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>
      {!compact ? (
        <div
          className={cn(
            "border border-border/60 bg-background/80",
            hero
              ? "rounded-2xl p-5 shadow-sm shadow-black/[0.03]"
              : "rounded-[var(--radius-md)] p-4",
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium">This Week</p>
            <p className="text-[11px] font-medium text-success">+12% vs last week</p>
          </div>
          <div className={cn("flex items-end gap-2", hero ? "h-36" : "h-28")}>
            {week.map((value, i) => (
              <div
                key={WEEK_LABELS[i]}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <div
                  className="marketing-chart-bar w-full max-w-10 rounded-t-md bg-gradient-to-t from-primary to-primary/55"
                  style={{ height: `${(value / 14) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {WEEK_LABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const RECEPTION_SLOTS = [
  {
    time: "9:00",
    names: ["Alex Rivera", "Alex Rivera", "Casey Ng"],
    services: ["Consultation", "In progress", "Wrapping up"],
    colors: ["bg-primary", "bg-spark", "bg-success"],
  },
  {
    time: "10:30",
    names: ["Jordan Lee", "Jordan Lee", "Open"],
    services: ["Follow-up", "Checked in", "Available slot"],
    colors: ["bg-spark", "bg-primary", "bg-muted"],
  },
  {
    time: "1:00",
    names: ["Sam Patel", "Sam Patel", "Sam Patel"],
    services: ["New client", "Confirmed", "Arriving soon"],
    colors: ["bg-success", "bg-success", "bg-primary"],
  },
  {
    time: "3:30",
    names: ["Open", "Alex Rivera", "Alex Rivera"],
    services: ["Available slot", "Just booked", "Confirmed"],
    colors: ["bg-muted", "bg-primary", "bg-primary"],
  },
];

function ReceptionPane({ live }: { live: boolean }) {
  const tick = useTick(live, 2600);
  const phase = tick % 3;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Reception · Day view</p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          Updating live
        </span>
      </div>
      <div className="grid gap-2">
        {RECEPTION_SLOTS.map((row) => (
          <div
            key={row.time}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/80 bg-background px-3 py-2 transition-all duration-500"
          >
            <span className="w-12 text-xs tabular-nums text-muted-foreground">
              {row.time}
            </span>
            <span
              className={cn(
                "h-8 w-1 rounded-full transition-colors duration-500",
                row.colors[phase],
              )}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium transition-opacity duration-300">
                {row.names[phase]}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.services[phase]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrmPane({ live }: { live: boolean }) {
  const tick = useTick(live, 2400);
  const events = [
    "Appointment confirmed · Today 9:00",
    "SMS reminder delivered",
    "Payment received · $180",
    "Note · Prefers morning appointments",
    "Summer logged conversation",
  ];
  const visible = live ? events.slice(0, 3 + (tick % 3)) : events.slice(0, 4);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">CRM · Customer profile</p>
      <div className="grid gap-3 md:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            AR
          </div>
          <p className="mt-3 text-base font-semibold">Alex Rivera</p>
          <p className="text-xs text-muted-foreground">Active · Prefers SMS</p>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Visits</dt>
              <dd className="font-medium tabular-nums">{14 + (tick % 2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Lifetime value</dt>
              <dd className="font-medium tabular-nums">
                ${(2480 + (tick % 4) * 40).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Customer timeline
          </p>
          <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
            {visible.map((event) => (
              <li
                key={event}
                className="marketing-row-in flex gap-2"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                {event}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CommunicationPane({ live }: { live: boolean }) {
  const tick = useTick(live, 2800);
  const replies = [
    "You're confirmed for 9:00 AM. We'll see you then.",
    "Reminder sent. Reply YES to confirm.",
    "Reschedule options ready — 10:30 or 2:00.",
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Communication Center</p>
        <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
          {tick % 2 === 0 ? "All caught up" : "1 new"}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-2">
          {[
            ["Alex Rivera", "Confirming tomorrow", "2m"],
            ["Jordan Lee", "Thanks for the reminder", "18m"],
            ["Sam Patel", "Need to reschedule", "1h"],
          ].map(([name, message, time], index) => (
            <div
              key={name}
              className={cn(
                "rounded-[var(--radius-md)] border p-3 transition-colors duration-500",
                index === tick % 3
                  ? "border-primary/35 bg-primary/5"
                  : "border-border/80 bg-background",
              )}
            >
              <div className="flex justify-between gap-2">
                <p className="text-xs font-semibold">{name}</p>
                <span className="text-[10px] text-muted-foreground">{time}</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {message}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
          <p className="text-xs font-semibold">Alex Rivera</p>
          <div className="mt-5 space-y-2 text-xs">
            <p className="max-w-[82%] rounded-xl rounded-bl-sm bg-muted px-3 py-2">
              Can you confirm my appointment tomorrow?
            </p>
            <p
              key={tick}
              className="marketing-row-in ml-auto max-w-[86%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
            >
              {replies[tick % replies.length]}
            </p>
          </div>
          <div className="mt-5 rounded-[var(--radius-sm)] border border-border/80 px-3 py-2 text-[11px] text-muted-foreground">
            Reply by SMS or email…
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsPane({ live }: { live: boolean }) {
  const tick = useTick(live, 2000);
  const bars = [42, 58, 49, 72, 64, 86, 93, 80, 96, 100].map(
    (h, i) => Math.min(100, h + ((tick + i) % 4) * 2),
  );
  const revenue = 22.4 + (tick % 6) * 0.35;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Reports · Executive</p>
        <span className="rounded-[var(--radius-sm)] border border-border px-2 py-1 text-[10px] text-muted-foreground">
          Last 30 days
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          ["Revenue MTD", `$${revenue.toFixed(1)}k`],
          ["Completed", String(318 + (tick % 5))],
          ["New customers", String(42 + (tick % 3))],
          ["No-shows", "3.1%"],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-[var(--radius-md)] border border-border/80 bg-background p-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums transition-all duration-500">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Revenue trend</p>
          <p className="text-[10px] font-medium text-success">+18.4%</p>
        </div>
        <div className="mt-4 flex h-28 items-end gap-2">
          {bars.map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-primary to-primary/45 transition-[height] duration-700 ease-out"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingPane({ live }: { live: boolean }) {
  const tick = useTick(live, 3000);
  const progress = 60 + (tick % 5) * 5;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Billing & subscription</p>
      <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            Current plan
          </p>
          <p className="mt-2 text-lg font-semibold">Professional</p>
          <p className="text-xs text-muted-foreground">$79/month · Active</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            3 of 4 team seats used
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
          <p className="text-xs font-semibold">Recent invoices</p>
          <div className="mt-3 grid gap-2 text-xs">
            {[
              ["INV-2048", "Jul 1", "$79.00", "Paid"],
              ["INV-1982", "Jun 1", "$79.00", "Paid"],
              ["INV-1910", "May 1", "$79.00", tick % 2 === 0 ? "Paid" : "Posted"],
            ].map(([invoice, date, amount, status]) => (
              <div
                key={invoice}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-[var(--radius-sm)] bg-muted/50 px-2 py-2"
              >
                <div>
                  <p className="font-medium">{invoice}</p>
                  <p className="text-[10px] text-muted-foreground">{date}</p>
                </div>
                <span>{amount}</span>
                <span className="text-success">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeesPane({ live }: { live: boolean }) {
  const tick = useTick(live, 2500);
  const statuses = ["On floor", "With client", "Break", "Available"];
  const people = [
    ["Jordan Lee", "Manager · Front desk"],
    ["Sam Patel", "Provider · Full time"],
    ["Casey Ng", "Provider · Part time"],
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Employees · Directory</p>
      <ul className="space-y-2">
        {people.map(([name, role], index) => (
          <li
            key={name}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border/80 bg-background px-3 py-2"
          >
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="text-xs text-muted-foreground">{role}</span>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {statuses[(tick + index) % statuses.length]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BusinessPane({ live }: { live: boolean }) {
  const tick = useTick(live, 2200);
  const items = [
    "Locations",
    "Categories",
    "Rooms",
    "Taxes",
    "Forms",
    "Automation",
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Business · Control center</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item}
            className={cn(
              "rounded-[var(--radius-md)] border px-3 py-2.5 text-sm font-medium transition-all duration-500",
              index === tick % items.length
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border/80 bg-background",
            )}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummerPane({ live }: { live: boolean }) {
  const reduced = useReducedMotion();
  const full =
    "Here are this location's hours from Business Management. I can also check real availability or start a booking — I never invent open slots.";
  const shouldAnimate = live && !reduced;
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setChars(i);
      if (i >= full.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [shouldAnimate, full]);

  const typed = shouldAnimate ? full.slice(0, Math.min(chars, full.length)) : full;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Spark className="h-5 w-5" size={20} animate={shouldAnimate} />
        <p className="text-sm font-semibold">Summer · AI Business Assistant</p>
        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
          {shouldAnimate && chars < full.length ? "Typing" : "Online"}
        </span>
      </div>
      <div className="space-y-2">
        <div className="ml-auto max-w-[85%] rounded-[var(--radius-md)] bg-primary px-3 py-2 text-xs text-primary-foreground">
          What are your hours this week?
        </div>
        <div className="max-w-[90%] rounded-[var(--radius-md)] border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed">
          {typed}
          {shouldAnimate && chars < full.length ? (
            <span className="marketing-typing-cursor" aria-hidden />
          ) : null}
        </div>
      </div>
    </div>
  );
}
