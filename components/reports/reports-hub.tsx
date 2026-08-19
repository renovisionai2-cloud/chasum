"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, WeekBars } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildReportCsv,
  deleteReportSchedule,
  logReportExport,
  upsertReportSchedule,
} from "@/lib/actions/reports";
import type { ReportsBundle, ReportType } from "@/lib/reports/types";
import { formatMoneyCents, formatMoneyDollars } from "@/lib/commerce/money";
import type { ActionState } from "@/lib/types/booking";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import {
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Gift,
  MapPin,
  Package,
  Printer,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useActionState, useState, useTransition } from "react";

type TabKey =
  | "executive"
  | "revenue"
  | "appointments"
  | "customers"
  | "employees"
  | "services"
  | "locations"
  | "financial"
  | "inventory"
  | "export"
  | "scheduled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "executive", label: "Executive" },
  { key: "revenue", label: "Revenue" },
  { key: "appointments", label: "Appointments" },
  { key: "customers", label: "Customers" },
  { key: "employees", label: "Employees" },
  { key: "services", label: "Services" },
  { key: "locations", label: "Locations" },
  { key: "financial", label: "Financial" },
  // Inventory is Roadmap/Coming Soon — not shown as a live tab.
  { key: "export", label: "Export" },
  { key: "scheduled", label: "Scheduled" },
];

function money(n: number, currency = "usd") {
  return formatMoneyDollars(n, currency);
}

function moneyExact(cents: number, currency = "usd") {
  return formatMoneyCents(cents, currency);
}

function MetricList({
  title,
  items,
  empty,
  format = "number",
  currency = "usd",
}: {
  title: string;
  items: { label: string; value: number; meta?: string }[];
  empty: string;
  format?: "number" | "money" | "plain";
  currency?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            variant="panel"
            title="Nothing here yet"
            description={empty}
          />
        ) : (
          <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
            {items.map((item) => (
              <li
                key={`${item.label}-${item.meta ?? ""}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.label}</p>
                  {item.meta ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.meta}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {format === "money"
                    ? money(item.value, currency)
                    : format === "plain"
                      ? item.value
                      : item.value.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsHub({ bundle }: { bundle: ReportsBundle }) {
  const [tab, setTab] = useState<TabKey>("executive");
  const { toast } = useToast();
  const refresh = useRefresh();
  const [exporting, startExport] = useTransition();
  const [deleting, startDelete] = useTransition();
  const currency = bundle.currency ?? "usd";
  const $ = (n: number) => money(n, currency);
  const $c = (cents: number) => moneyExact(cents, currency);

  const [schedState, schedAction, schedPending] = useActionState(
    upsertReportSchedule,
    {} as ActionState,
  );
  useFormAction(schedState, () => refresh());

  const e = bundle.executive;

  function downloadCsv(reportType: ReportType) {
    startExport(async () => {
      const result = await buildReportCsv(reportType);
      if ("error" in result) {
        toast(result.error, "error");
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast("CSV downloaded.", "success");
    });
  }

  function printReport() {
    startExport(async () => {
      await logReportExport({
        reportType: tab === "scheduled" || tab === "export" ? "executive" : tab,
        format: "print",
        rowCount: 0,
      });
      window.print();
    });
  }

  return (
    <div className="space-y-6">
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 print:hidden">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "executive" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Gross payments collected today"
              value={
                e.paymentsCollectedAvailable
                  ? $c(Math.round(e.revenueToday * 100))
                  : "Unavailable"
              }
              icon={Wallet}
              accent="success"
              href="/dashboard/payments"
              description="Commerce ledger · business timezone · same as Payments"
            />
            <StatCard
              title="Gross payments collected this week"
              value={
                e.paymentsCollectedAvailable
                  ? $c(Math.round(e.revenueWeek * 100))
                  : "Unavailable"
              }
              icon={BarChart3}
              accent="primary"
              href="/dashboard/payments"
              description="Business timezone · same as Payments"
            />
            <StatCard
              title="Gross payments collected this month"
              value={
                e.paymentsCollectedAvailable
                  ? $c(Math.round(e.revenueMonth * 100))
                  : "Unavailable"
              }
              icon={BarChart3}
              accent="spark"
              href="/dashboard/payments"
              description="Business timezone · same as Payments"
            />
            <StatCard
              title="Payments collected this year"
              value="Unavailable"
              icon={Wallet}
              accent="primary"
              description="Full-year reporting deferred to Chapter 10"
            />
            <StatCard
              title="Appointments today"
              value={String(e.appointmentsToday)}
              icon={CalendarDays}
              href="/dashboard/calendar"
              description="Active bookings · business timezone"
            />
            <StatCard
              title="Upcoming"
              value={String(e.upcomingAppointments)}
              icon={CalendarDays}
              description="Not cancelled or no-show"
            />
            <StatCard
              title="New customers"
              value={String(e.newCustomers)}
              icon={Users}
              accent="success"
              href="/dashboard/clients"
              description="This month"
            />
            <StatCard
              title="Prior customers booked this month"
              value={String(e.returningCustomers)}
              icon={Users}
              description="Active booking this month · customer created before this month (not repeat completed visits)"
            />
            <StatCard
              title="Active employees"
              value={String(e.activeEmployees)}
              icon={Users}
              href="/dashboard/employees"
            />
            <StatCard
              title="Outstanding invoices"
              value={
                e.outstandingInvoicesAvailable
                  ? $c(e.outstandingInvoicesCents)
                  : "Unavailable"
              }
              icon={FileSpreadsheet}
              accent="warning"
              href="/dashboard/payments"
              description={
                e.outstandingInvoicesAvailable
                  ? `${e.outstandingInvoicesCount} open · same as Payments`
                  : "Commerce ledger unavailable"
              }
            />
            {e.showMembershipMetric ? (
              <StatCard
                title="Membership plan catalog (Beta)"
                value={$c(e.membershipRevenueCents)}
                icon={Package}
                description="List price of active plans — not collected revenue"
              />
            ) : null}
            <StatCard
              title="Gift card revenue"
              value={$c(e.giftCardRevenueCents)}
              icon={Gift}
              description="Redeemed value"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Gross payments collected and outstanding invoice balances match
            Command Centre and Payments (commerce ledger — real open invoices
            only). Outstanding appointment balances are a separate Payments
            metric. Appointment counts use business timezone and exclude
            cancelled / no-show. Inventory reporting is Coming Soon.
            Membership collected revenue is Beta and hidden until billing
            lifecycle is complete. Deeper BI redesign is Chapter 10.
          </p>
        </div>
      ) : null}

      {tab === "revenue" ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Recognized appointment value (completed visit or collected stamp),
            tax-exclusive. This is not Gross payments collected. Daily = last 14
            days. Monthly, employee, location, service, and category on this tab
            = year to date. Employee / location / service tabs below use this
            calendar month.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily recognized value (last 14 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {bundle.revenue.daily.length === 0 ? (
                <EmptyState
                  variant="panel"
                  title="No revenue yet"
                  description="Completed appointments will appear here."
                />
              ) : (
                <WeekBars data={bundle.revenue.daily} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monthly (year to date)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.monthly} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By employee (year to date)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.byEmployee} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By location (year to date)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.byLocation} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By service (year to date)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.byService} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By category (year to date)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.byCategory} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quarterly & yearly</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <BarChart data={bundle.revenue.quarterly} />
              <BarChart data={bundle.revenue.yearly} />
            </CardContent>
          </Card>
        </div>
        </div>
      ) : null}

      {tab === "appointments" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Booked"
              value={String(bundle.appointments.booked)}
              icon={CalendarDays}
              description="This month"
            />
            <StatCard
              title="Completed"
              value={String(bundle.appointments.completed)}
              icon={CalendarDays}
              accent="success"
              description="This month"
            />
            <StatCard
              title="Cancelled"
              value={String(bundle.appointments.cancelled)}
              icon={CalendarDays}
              accent="warning"
            />
            <StatCard
              title="No shows"
              value={String(bundle.appointments.noShows)}
              icon={CalendarDays}
            />
            <StatCard
              title="Rescheduled"
              value={String(bundle.appointments.rescheduled)}
              icon={CalendarDays}
              description="Appointments whose start or end time actually moved — not ordinary edits or payments."
            />
            <StatCard
              title="Waitlist conversions"
              value={String(bundle.appointments.waitlistConversions)}
              icon={Sparkles}
            />
            <StatCard
              title="Avg booking value"
              value={$(bundle.appointments.averageBookingValue)}
              icon={Wallet}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking trends</CardTitle>
              </CardHeader>
              <CardContent>
                <WeekBars data={bundle.appointments.bookingTrends} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Peak hours</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={bundle.appointments.peakHours} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Peak days</CardTitle>
              </CardHeader>
              <CardContent>
                <WeekBars data={bundle.appointments.peakDays} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "customers" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="New customers"
              value={String(bundle.customers.newCustomers)}
              icon={Users}
              accent="success"
              description="This month"
            />
            <StatCard
              title="Repeat completed visits"
              value={String(bundle.customers.returningCustomers)}
              icon={Users}
              description="Customers with 2+ completed appointments (all time). Cancelled / booked-only do not count."
            />
            <StatCard
              title="Avg collected per customer"
              value={$(bundle.customers.lifetimeValueAvg)}
              icon={Wallet}
              description="Mean of each paying customer's recorded payment total — not average transaction size."
            />
            <StatCard
              title="Directory activity (90d)"
              value={`${bundle.customers.retentionRate}%`}
              icon={Users}
              description="Customers whose last_activity_at (or created_at) is within 90 days ÷ all customers"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer growth</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={bundle.customers.growthSeries} />
              </CardContent>
            </Card>
            <MetricList
              title="Birthday report (this month)"
              items={bundle.customers.birthdaysThisMonth}
              empty="No birthdays this month."
              format="plain"
             currency={currency} />
            <MetricList
              title="Top customers (recorded payments)"
              items={bundle.customers.topCustomers}
              empty="No recorded payment events or completed-visit fallback spend yet."
              format="money"
             currency={currency} />
            <MetricList
              title="Inactive customers"
              items={bundle.customers.inactiveCustomers}
              empty="No inactive customers."
             currency={currency} />
          </div>
        </div>
      ) : null}

      {tab === "employees" ? (
        <Card>
          <CardHeader>
            <CardTitle>Employee performance</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">
              This calendar month (business timezone) · recognized appointment
              value, same as Revenue tab (tax-exclusive catalog/price — not
              Gross payments collected). Completed = status completed only.
              Productivity = active bookings this month.
            </p>
          </CardHeader>
          <CardContent>
            {bundle.employees.length === 0 ? (
              <EmptyState
                variant="panel"
                title="No employees"
                description="Add team members to see revenue and productivity."
              />
            ) : (
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Completed visits</TableHead>
                    <TableHead>Avg time</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Booked (productivity)</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.employees.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="tabular-nums">
                        {$(row.revenue)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.completed}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.averageServiceMinutes}m
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {$c(row.commissionCents)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.productivity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.averageRating ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "services" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Package catalog"
              value={String(bundle.services.packageSales)}
              description="Configured package products. Services named Package are counted as services, not here."
              icon={Package}
            />
            <StatCard
              title="Memberships"
              value={String(bundle.services.membershipSales)}
              icon={Wallet}
            />
            <StatCard
              title="Gift cards issued"
              value={String(bundle.services.giftCardSales)}
              icon={Gift}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <MetricList
              title="Most popular"
              items={bundle.services.mostPopular}
              empty="No completed services this month."
             currency={currency} />
            <MetricList
              title="Least popular"
              items={bundle.services.leastPopular}
              empty="No service data yet."
             currency={currency} />
            <Card>
              <CardHeader>
                <CardTitle>Revenue by service</CardTitle>
                <p className="text-xs font-normal text-muted-foreground">
                  This calendar month · recognized appointment value
                </p>
              </CardHeader>
              <CardContent>
                <BarChart data={bundle.services.revenueByService} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Service duration (min)</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={bundle.services.durationByService} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "locations" ? (
        <Card>
          <CardHeader>
            <CardTitle>Location performance</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">
              This calendar month (business timezone) · recognized appointment
              value, same as Revenue tab (not Gross payments collected).
              Appointments = non-cancelled this month. Customers = distinct
              customers on those appointments.
            </p>
          </CardHeader>
          <CardContent>
            {bundle.locations.length === 0 ? (
              <EmptyState
                variant="panel"
                title="No locations"
                description="Add locations in Business Management."
              />
            ) : (
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Appointments</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.locations.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {row.name}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {$(row.revenue)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.appointments}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.customers}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.employees}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.occupancyPct}%
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.growthPct}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "financial" ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Payments collected this month include deposits. Refunds are
            separate and are not subtracted. Taxes and discounts are appointment
            stamps for this calendar month, not the cash ledger.
          </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Outstanding invoices"
            value={$c(bundle.financial.invoicesCents)}
            icon={FileSpreadsheet}
            description="Commerce invoices · same as Payments"
          />
          <StatCard
            title="Payments collected"
            value={$c(bundle.financial.paymentsCents)}
            icon={Wallet}
            accent="success"
            description={
              bundle.financial.paymentsIncludeDeposits
                ? `This month · of which deposits ${$c(bundle.financial.depositsCents)}`
                : "Legacy payment events"
            }
          />
          <StatCard
            title="Refunds"
            value={$c(bundle.financial.refundsCents)}
            icon={Wallet}
            accent="warning"
            description="This month · not subtracted from payments collected"
          />
          <StatCard
            title="Taxes (appointment stamps)"
            value={$c(bundle.financial.taxesCents)}
            icon={FileSpreadsheet}
            description="This calendar month"
          />
          <StatCard
            title="Discounts (appointment stamps)"
            value={$c(bundle.financial.discountsCents)}
            icon={FileSpreadsheet}
            description="This calendar month"
          />
          <StatCard
            title="Deposits collected"
            value={$c(bundle.financial.depositsCents)}
            icon={Wallet}
            description="Subset of payments collected this month"
          />
          <StatCard
            title="Outstanding appointment balances"
            value={$c(bundle.financial.outstandingCents)}
            icon={FileSpreadsheet}
            accent="warning"
            description="Collectible remaining · not invoices"
          />
        </div>
        </div>
      ) : null}

      {tab === "inventory" ? (
        <Card>
          <CardHeader>
            <CardTitle>Inventory reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {bundle.inventory.note}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Product sales"
                value="—"
                icon={Package}
                description="Future ready"
              />
              <StatCard
                title="Stock levels"
                value="—"
                icon={Package}
                description="Future ready"
              />
              <StatCard
                title="Low inventory"
                value="—"
                icon={Package}
                description="Future ready"
              />
              <StatCard
                title="Supplier orders"
                value="—"
                icon={Package}
                description="Future ready"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "export" ? (
        <Card>
          <CardHeader>
            <CardTitle>Export & share</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download CSV (Excel-compatible), print for PDF, or schedule email
              delivery. Exports stay scoped to this business and location.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "executive",
                  "revenue",
                  "appointments",
                  "customers",
                  "employees",
                  "services",
                  "locations",
                  "financial",
                ] as ReportType[]
              ).map((type) => (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={exporting}
                  onClick={() => downloadCsv(type)}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {type} CSV
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={exporting}
                onClick={printReport}
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print / PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "scheduled" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled reports</CardTitle>
            </CardHeader>
            <CardContent>
              {bundle.schedules.length === 0 ? (
                <EmptyState
                  variant="panel"
                  title="No schedules"
                  description="Create daily, weekly, monthly, or yearly email deliveries."
                />
              ) : (
                <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
                  {bundle.schedules.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.report_type} · {s.cadence} · {s.format} ·{" "}
                          {s.recipients.join(", ")}
                          {s.enabled ? "" : " · paused"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={deleting}
                        onClick={() => {
                          startDelete(async () => {
                            if (!(await confirmDelete("Delete this schedule?")))
                              return;
                            const result = await deleteReportSchedule(s.id);
                            if (result.error) toast(result.error, "error");
                            else {
                              toast(result.success ?? "Deleted.", "success");
                              refresh();
                            }
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={schedAction} className="space-y-3">
                <Input name="name" placeholder="Schedule name" required />
                <Select name="report_type" defaultValue="executive">
                  <option value="executive">Executive</option>
                  <option value="revenue">Revenue</option>
                  <option value="appointments">Appointments</option>
                  <option value="customers">Customers</option>
                  <option value="employees">Employees</option>
                  <option value="services">Services</option>
                  <option value="locations">Locations</option>
                  <option value="financial">Financial</option>
                </Select>
                <Select name="cadence" defaultValue="weekly">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
                <Select name="format" defaultValue="email">
                  <option value="email">Email</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </Select>
                <Input
                  name="recipients"
                  placeholder="email@example.com, other@example.com"
                  required
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked />{" "}
                  Enabled
                </label>
                <AlertMessage
                  error={schedState.error}
                  success={schedState.success}
                />
                <FormFooter
                  pending={schedPending || deleting}
                  submitLabel="Save schedule"
                />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
