import { Spark } from "@/components/brand/spark";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Reception", icon: Calendar },
  { label: "CRM", icon: Users },
  { label: "Business", icon: Building2 },
  { label: "Employees", icon: UserCog },
  { label: "Reports", icon: BarChart3 },
  { label: "Communication", icon: MessageSquareText },
  { label: "Billing", icon: CreditCard },
  { label: "AI Workforce", icon: Sparkles },
] as const;

const WEEK = [
  { label: "Mon", value: 6 },
  { label: "Tue", value: 9 },
  { label: "Wed", value: 7 },
  { label: "Thu", value: 11 },
  { label: "Fri", value: 10 },
  { label: "Sat", value: 5 },
  { label: "Sun", value: 2 },
];

type DashboardPreviewProps = {
  className?: string;
  variant?:
    | "overview"
    | "reception"
    | "crm"
    | "reports"
    | "emma"
    | "employees"
    | "business"
    | "communication"
    | "billing";
  compact?: boolean;
  animated?: boolean;
};

/** Presentational mirror of the real Chasum dashboard — marketing only, no live data. */
export function DashboardPreview({
  className,
  variant = "overview",
  compact = false,
  animated = false,
}: DashboardPreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-lg transition-[transform,box-shadow,border-color] duration-500",
        animated && "marketing-dashboard-float",
        className,
      )}
      role="img"
      aria-label="Chasum dashboard preview"
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        <span className="ml-2 truncate text-xs text-muted-foreground">
          app.chasum.com/dashboard/{variant === "overview" ? "" : variant}
        </span>
      </div>

      <div className={cn("flex", compact ? "min-h-[220px]" : "min-h-[360px] md:min-h-[480px]")}>
        <aside className="hidden w-44 shrink-0 border-r border-border bg-muted/20 p-3 sm:block">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                (variant === "emma" && item.label === "AI Workforce");
              return (
                <li
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs transition-colors duration-300",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 p-4 md:p-5" key={variant}>
          <div className="marketing-pane-fade">
            {variant === "overview" ? <OverviewPane compact={compact} /> : null}
            {variant === "reception" ? <ReceptionPane /> : null}
            {variant === "crm" ? <CrmPane /> : null}
            {variant === "communication" ? <CommunicationPane /> : null}
            {variant === "reports" ? <ReportsPane /> : null}
            {variant === "billing" ? <BillingPane /> : null}
            {variant === "emma" ? <EmmaPane /> : null}
            {variant === "employees" ? <EmployeesPane /> : null}
            {variant === "business" ? <BusinessPane /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewPane({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Good morning · My Business</p>
        <p className="text-lg font-semibold tracking-tight md:text-xl">
          Run today from one operating system
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Today", value: "12", hint: "Appointments" },
          { title: "Revenue", value: "$1.8k", hint: "Completed today" },
          { title: "This week", value: "54", hint: "Active bookings" },
          { title: "Clients", value: "286", hint: "+18 this month" },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-[var(--radius-md)] border border-border/80 bg-background p-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {stat.title}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>
      {!compact ? (
        <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
          <p className="mb-3 text-sm font-medium">This week</p>
          <div className="flex h-28 items-end gap-2">
            {WEEK.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full max-w-8 rounded-t-[var(--radius-sm)] bg-primary/85"
                  style={{ height: `${(d.value / 11) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReceptionPane() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Reception · Day view</p>
      <div className="grid gap-2">
        {[
          { time: "9:00", name: "Alex Rivera", service: "Consultation", color: "bg-primary" },
          { time: "10:30", name: "Jordan Lee", service: "Follow-up", color: "bg-spark" },
          { time: "1:00", name: "Sam Patel", service: "New client", color: "bg-success" },
          { time: "3:30", name: "Open", service: "Available slot", color: "bg-muted" },
        ].map((row) => (
          <div
            key={row.time}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/80 bg-background px-3 py-2"
          >
            <span className="w-12 text-xs tabular-nums text-muted-foreground">
              {row.time}
            </span>
            <span className={cn("h-8 w-1 rounded-full", row.color)} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.service}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrmPane() {
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
              <dd className="font-medium">14</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Lifetime value</dt>
              <dd className="font-medium">$2,480</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Customer timeline
          </p>
          <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
            {[
              "Appointment confirmed · Today 9:00",
              "SMS reminder delivered",
              "Payment received · $180",
              "Note · Prefers morning appointments",
            ].map((event) => (
              <li key={event} className="flex gap-2">
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

function CommunicationPane() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Communication Center</p>
        <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
          All caught up
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
                "rounded-[var(--radius-md)] border p-3",
                index === 0
                  ? "border-primary/35 bg-primary/5"
                  : "border-border/80 bg-background",
              )}
            >
              <div className="flex justify-between gap-2">
                <p className="text-xs font-semibold">{name}</p>
                <span className="text-[10px] text-muted-foreground">{time}</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{message}</p>
            </div>
          ))}
        </div>
        <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
          <p className="text-xs font-semibold">Alex Rivera</p>
          <div className="mt-5 space-y-2 text-xs">
            <p className="max-w-[82%] rounded-xl rounded-bl-sm bg-muted px-3 py-2">
              Can you confirm my appointment tomorrow?
            </p>
            <p className="ml-auto max-w-[86%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
              You&apos;re confirmed for 9:00 AM. We&apos;ll see you then.
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

function ReportsPane() {
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
          ["Revenue MTD", "$24.1k"],
          ["Completed", "318"],
          ["New customers", "42"],
          ["No-shows", "3.1%"],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-[var(--radius-md)] border border-border/80 bg-background p-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Revenue trend</p>
          <p className="text-[10px] font-medium text-success">+18.4%</p>
        </div>
        <div className="mt-4 flex h-28 items-end gap-2">
          {[42, 58, 49, 72, 64, 86, 93, 80, 96, 100].map((height, index) => (
            <div
              key={`${height}-${index}`}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-primary to-primary/45"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingPane() {
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
            <div className="h-full w-3/4 rounded-full bg-primary" />
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
              ["INV-1910", "May 1", "$79.00", "Paid"],
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
      <div className="rounded-[var(--radius-md)] border border-border/80 bg-background p-3">
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="flex justify-between rounded-[var(--radius-sm)] bg-muted/50 px-2 py-1.5">
            <span>Next invoice</span>
            <span className="font-medium">Aug 1</span>
          </div>
          <div className="flex justify-between rounded-[var(--radius-sm)] bg-muted/50 px-2 py-1.5">
            <span>Trial / Stripe path</span>
            <span className="font-medium">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeesPane() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Employees · Directory</p>
      <ul className="space-y-2">
        {[
          ["Jordan Lee", "Manager · Front desk"],
          ["Sam Patel", "Provider · Full time"],
          ["Casey Ng", "Provider · Part time"],
        ].map(([name, role]) => (
          <li
            key={name}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-border/80 bg-background px-3 py-2"
          >
            <span className="text-sm font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BusinessPane() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Business · Control center</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {["Locations", "Categories", "Rooms", "Taxes", "Forms", "Automation"].map(
          (item) => (
            <div
              key={item}
              className="rounded-[var(--radius-md)] border border-border/80 bg-background px-3 py-2.5 text-sm font-medium"
            >
              {item}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function EmmaPane() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Spark className="h-5 w-5" size={20} animate />
        <p className="text-sm font-semibold">Emma · AI Receptionist</p>
      </div>
      <div className="space-y-2">
        <div className="ml-auto max-w-[85%] rounded-[var(--radius-md)] bg-primary px-3 py-2 text-xs text-primary-foreground">
          What are your hours this week?
        </div>
        <div className="max-w-[90%] rounded-[var(--radius-md)] border border-border bg-muted/40 px-3 py-2 text-xs">
          Here are this location&apos;s hours from Business Management. I can also
          check real availability or start a booking — I never invent open slots.
        </div>
      </div>
    </div>
  );
}
