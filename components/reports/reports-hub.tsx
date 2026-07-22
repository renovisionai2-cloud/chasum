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
  buildReportCsv,
  deleteReportSchedule,
  logReportExport,
  upsertReportSchedule,
} from "@/lib/actions/reports";
import type { ReportsBundle, ReportType } from "@/lib/reports/types";
import { currencyCode } from "@/lib/commerce/money";
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
  { key: "inventory", label: "Inventory" },
  { key: "export", label: "Export" },
  { key: "scheduled", label: "Scheduled" },
];

function money(n: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode(currency),
    maximumFractionDigits: 0,
  }).format(n);
}

function moneyExact(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode(currency),
  }).format(cents / 100);
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
          <EmptyState variant="panel" title="No data" description={empty} />
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
              title="Revenue today"
              value={$(e.revenueToday)}
              icon={Wallet}
              accent="success"
              href="/dashboard/calendar"
            />
            <StatCard
              title="Revenue this week"
              value={$(e.revenueWeek)}
              icon={BarChart3}
              accent="primary"
            />
            <StatCard
              title="Revenue this month"
              value={$(e.revenueMonth)}
              icon={BarChart3}
              accent="spark"
            />
            <StatCard
              title="Revenue this year"
              value={$(e.revenueYear)}
              icon={Wallet}
              accent="primary"
            />
            <StatCard
              title="Appointments today"
              value={String(e.appointmentsToday)}
              icon={CalendarDays}
              href="/dashboard/calendar"
            />
            <StatCard
              title="Upcoming"
              value={String(e.upcomingAppointments)}
              icon={CalendarDays}
              description="Not cancelled"
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
              title="Returning customers"
              value={String(e.returningCustomers)}
              icon={Users}
              description="This month"
            />
            <StatCard
              title="Active employees"
              value={String(e.activeEmployees)}
              icon={Users}
              href="/dashboard/employees"
            />
            <StatCard
              title="Outstanding invoices"
              value={$c(e.outstandingInvoicesCents)}
              icon={FileSpreadsheet}
              accent="warning"
            />
            <StatCard
              title="Membership revenue"
              value={$c(e.membershipRevenueCents)}
              icon={Package}
              description="Active plans"
            />
            <StatCard
              title="Gift card revenue"
              value={$c(e.giftCardRevenueCents)}
              icon={Gift}
              description="Redeemed value"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Metrics respect your location scope and multi-tenant business
            boundary. Snapshot ready for Owner Platform and AI Workforce.
          </p>
        </div>
      ) : null}

      {tab === "revenue" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily revenue (14 days)</CardTitle>
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
              <CardTitle>Monthly</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.monthly} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By employee</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.byEmployee} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By location</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.byLocation} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By service</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={bundle.revenue.byService} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By category</CardTitle>
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
              title="Returning"
              value={String(bundle.customers.returningCustomers)}
              icon={Users}
            />
            <StatCard
              title="Avg lifetime value"
              value={$(bundle.customers.lifetimeValueAvg)}
              icon={Wallet}
            />
            <StatCard
              title="Retention"
              value={`${bundle.customers.retentionRate}%`}
              icon={Users}
              description="Active in last 90 days"
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
              title="Top customers"
              items={bundle.customers.topCustomers}
              empty="No customer spend yet."
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
          </CardHeader>
          <CardContent>
            {bundle.employees.length === 0 ? (
              <EmptyState
                variant="panel"
                title="No employees"
                description="Add team members to see revenue and productivity."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 font-medium">Employee</th>
                      <th className="px-2 py-2 font-medium">Revenue</th>
                      <th className="px-2 py-2 font-medium">Completed</th>
                      <th className="px-2 py-2 font-medium">Avg time</th>
                      <th className="px-2 py-2 font-medium">Commission</th>
                      <th className="px-2 py-2 font-medium">Productivity</th>
                      <th className="px-2 py-2 font-medium">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/80">
                    {bundle.employees.map((row) => (
                      <tr key={row.id}>
                        <td className="px-2 py-2.5 font-medium">{row.name}</td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {$(row.revenue)}
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {row.completed}
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {row.averageServiceMinutes}m
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {$c(row.commissionCents)}
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {row.productivity}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">
                          {row.averageRating ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          </CardHeader>
          <CardContent>
            {bundle.locations.length === 0 ? (
              <EmptyState
                variant="panel"
                title="No locations"
                description="Add locations in Business Management."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 font-medium">Location</th>
                      <th className="px-2 py-2 font-medium">Revenue</th>
                      <th className="px-2 py-2 font-medium">Appointments</th>
                      <th className="px-2 py-2 font-medium">Customers</th>
                      <th className="px-2 py-2 font-medium">Employees</th>
                      <th className="px-2 py-2 font-medium">Occupancy</th>
                      <th className="px-2 py-2 font-medium">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/80">
                    {bundle.locations.map((row) => (
                      <tr key={row.id}>
                        <td className="px-2 py-2.5 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {row.name}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {$(row.revenue)}
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {row.appointments}
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {row.customers}
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {row.employees}
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {row.occupancyPct}%
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {row.growthPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "financial" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Invoices"
            value={$c(bundle.financial.invoicesCents)}
            icon={FileSpreadsheet}
          />
          <StatCard
            title="Payments"
            value={$c(bundle.financial.paymentsCents)}
            icon={Wallet}
            accent="success"
          />
          <StatCard
            title="Refunds"
            value={$c(bundle.financial.refundsCents)}
            icon={Wallet}
            accent="warning"
          />
          <StatCard
            title="Taxes"
            value={$c(bundle.financial.taxesCents)}
            icon={FileSpreadsheet}
          />
          <StatCard
            title="Discounts"
            value={$c(bundle.financial.discountsCents)}
            icon={FileSpreadsheet}
          />
          <StatCard
            title="Deposits"
            value={$c(bundle.financial.depositsCents)}
            icon={Wallet}
          />
          <StatCard
            title="Outstanding balances"
            value={$c(bundle.financial.outstandingCents)}
            icon={FileSpreadsheet}
            accent="warning"
          />
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
