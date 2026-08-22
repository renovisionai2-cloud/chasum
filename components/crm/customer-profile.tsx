"use client";

import { BookingSheet } from "@/components/booking-sheet";
import { CollectPaymentWorkspace } from "@/components/commerce/collect-payment-workspace";
import { CustomerCommercePanel } from "@/components/commerce/customer-commerce-panel";
import { CommunicationCenter } from "@/components/communication/communication-center";
import { CustomerPaymentSummary } from "@/components/crm/customer-payment-summary";
import { CustomerInsightsPanel } from "@/components/crm/customer-insights";
import { CustomerNotesPanel } from "@/components/crm/customer-notes-panel";
import {
  CustomerMarketingForm,
  CustomerOverviewRead,
} from "@/components/crm/customer-overview-read";
import { CustomerQuickActions } from "@/components/crm/customer-quick-actions";
import { CustomerTimeline } from "@/components/crm/customer-timeline";
import { CustomerDocumentsPanel } from "@/components/customers/customer-documents-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, TagBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cancelAppointment } from "@/lib/actions/appointments";
import {
  getCrmAppointmentForBooking,
  sparkCrmQueryAction,
} from "@/lib/actions/crm";
import type { Membership } from "@/lib/business/types";
import { formatMoneyCents } from "@/lib/commerce/money";
import type { CustomerCommerceAccount } from "@/lib/commerce/types";
import { chaseHintsFromInsights } from "@/lib/crm/chase-hints";
import {
  displayCrmStatusLabel,
  isVipCustomer,
} from "@/lib/crm/customer-health";
import { displayCustomerName } from "@/lib/crm/display";
import type { CrmProfile } from "@/lib/crm/types";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import type {
  AppointmentWithRelations,
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { confirmDelete, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { format } from "date-fns";
import { MessageSquare, Sparkles } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";

type TabKey =
  | "overview"
  | "appointments"
  | "billing"
  | "communication"
  | "notes"
  | "documents"
  | "timeline"
  | "insights"
  | "marketing"
  | "spark";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "appointments", label: "Appointments" },
  { key: "billing", label: "Billing" },
  { key: "communication", label: "Messages" },
  { key: "notes", label: "Notes" },
  { key: "documents", label: "Documents" },
  { key: "timeline", label: "Timeline" },
  { key: "insights", label: "Insights" },
  { key: "marketing", label: "Marketing" },
  { key: "spark", label: "Summer" },
];

function appointmentBalanceDueCents(
  appt: CrmProfile["appointments"]["upcoming"][number],
): number | null {
  const price =
    typeof appt.price_cents === "number" && appt.price_cents > 0
      ? appt.price_cents
      : typeof appt.service?.price === "number"
        ? Math.round(Number(appt.service.price) * 100)
        : null;
  if (price == null) return null;
  const paid = Number(appt.amount_paid_cents ?? 0);
  return Math.max(0, price - paid);
}

function appointmentPaymentActionLabel(
  appt: CrmProfile["appointments"]["upcoming"][number],
): string {
  const status = (appt.payment_status ?? "").toLowerCase();
  if (status === "fully_paid" || status === "paid") return "Paid";
  const due = appointmentBalanceDueCents(appt);
  if (due != null && due > 0) return "Balance due";
  if (status.includes("deposit")) return "View billing";
  if (status === "unpaid" || status === "partially_paid" || status === "partial") {
    return "View billing";
  }
  return "View billing";
}

function AppointmentList({
  items,
  emptyTitle,
  emptyDescription,
  currency,
  onOpenBilling,
}: {
  items: CrmProfile["appointments"]["upcoming"];
  emptyTitle: string;
  emptyDescription: string;
  currency?: string | null;
  onOpenBilling?: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-border px-3 py-4">
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((appt) => {
        const due = appointmentBalanceDueCents(appt);
        const actionLabel = appointmentPaymentActionLabel(appt);
        return (
          <li
            key={appt.id}
            className="rounded-[var(--radius-md)] border border-border/80 bg-background/60 px-3 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight">
                  {appt.service?.name ?? "Service"}
                  {appt.recurring_rule_id ? " · Recurring" : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(parseISO(appt.start_time), "MMM d, yyyy")} ·{" "}
                  {formatTime(parseISO(appt.start_time))}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    appt.staff?.name ? `Employee: ${appt.staff.name}` : null,
                    appt.location?.name
                      ? `Location: ${appt.location.name}`
                      : null,
                    appt.payment_status
                      ? `Payment: ${appt.payment_status.replace(/_/g, " ")}`
                      : null,
                    due != null && due > 0
                      ? `Due: ${formatMoneyCents(due, currency)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {appt.internal_notes ? (
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                    Notes: {appt.internal_notes}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge status={appt.status} />
                {onOpenBilling ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="min-h-9 px-2 text-xs"
                    onClick={onOpenBilling}
                  >
                    {actionLabel}
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function buildObservedFacts(
  profile: CrmProfile,
  commerceAccount: CustomerCommerceAccount,
  currency: string | null | undefined,
): string[] {
  const facts: string[] = [];
  const upcoming = profile.appointments.upcoming.length;
  if (upcoming > 0) {
    facts.push(
      `This customer has ${upcoming} upcoming appointment${upcoming === 1 ? "" : "s"}.`,
    );
  } else {
    facts.push("No upcoming appointments on file.");
  }
  if (commerceAccount.outstandingAppointmentBalanceCents > 0) {
    facts.push(
      `The customer has ${formatMoneyCents(commerceAccount.outstandingAppointmentBalanceCents, currency)} outstanding on appointments.`,
    );
  } else {
    facts.push("No outstanding appointment balance.");
  }
  if (commerceAccount.outstandingInvoiceCents > 0) {
    facts.push(
      `${formatMoneyCents(commerceAccount.outstandingInvoiceCents, currency)} remains on commerce invoices.`,
    );
  }
  if (profile.customer.preferred_communication_method) {
    facts.push(
      `Preferred communication method: ${profile.customer.preferred_communication_method}.`,
    );
  }
  facts.push(
    `${profile.insights.completedAppointments} completed visit${profile.insights.completedAppointments === 1 ? "" : "s"} recorded.`,
  );
  if (profile.insights.cancellationCount > 0) {
    facts.push(
      `${profile.insights.cancellationCount} of ${profile.insights.totalAppointments} appointments cancelled.`,
    );
  }
  return facts;
}

export function CustomerProfileView({
  profile,
  staff,
  locations,
  services,
  customers,
  memberships,
  mapsAddress,
  commerceAccount,
  currency = "cad",
  smsAllowed = true,
  smsBlockedReason = null,
}: {
  profile: CrmProfile;
  staff: StaffWithServices[];
  locations: Location[];
  services: Service[];
  customers: Customer[];
  memberships: Membership[];
  mapsAddress?: string | null;
  commerceAccount: CustomerCommerceAccount;
  currency?: string | null;
  smsAllowed?: boolean;
  smsBlockedReason?: string | null;
}) {
  const { customer } = profile;
  const [tab, setTab] = useState<TabKey>("overview");
  const [sparkPending, startSpark] = useTransition();
  const [actionBusy, startAction] = useTransition();
  const [sparkResult, setSparkResult] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetAppointment, setSheetAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [collectOpen, setCollectOpen] = useState(false);
  const refresh = useRefresh();
  const { toast } = useToast();

  const displayName = displayCustomerName(customer);
  const nextUpcoming = profile.appointments.upcoming[0] ?? null;
  const chaseHints = chaseHintsFromInsights(profile.insights);
  const outstanding = commerceAccount.outstandingBalanceCents;
  const observedFacts = useMemo(
    () => buildObservedFacts(profile, commerceAccount, currency),
    [profile, commerceAccount, currency],
  );

  function openBook() {
    setSheetAppointment(null);
    setSheetOpen(true);
  }

  function openReschedule() {
    if (!nextUpcoming) return;
    startAction(async () => {
      const full = await getCrmAppointmentForBooking(nextUpcoming.id);
      if (!full) {
        toast("Could not load appointment for reschedule.", "error");
        return;
      }
      setSheetAppointment(full);
      setSheetOpen(true);
    });
  }

  function cancelNext() {
    if (!nextUpcoming) return;
    startAction(async () => {
      if (
        !(await confirmDelete(
          `Cancel ${nextUpcoming.service?.name ?? "upcoming appointment"}?`,
        ))
      ) {
        return;
      }
      const result = await cancelAppointment(nextUpcoming.id);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Appointment cancelled.", "success");
        refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card className="print:shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <div className="relative mx-auto h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:mx-0">
            {customer.photo_url ? (
              <Image
                src={customer.photo_url}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {displayName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <div>
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {displayName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {customer.email}
                {customer.phone ? ` · ${customer.phone}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {displayCrmStatusLabel(customer.crm_status)}
                {isVipCustomer(customer) ? " · VIP" : ""}
                {profile.assignedStaff?.name
                  ? ` · ${profile.assignedStaff.name}`
                  : ""}
                {profile.preferredLocation?.name
                  ? ` · ${profile.preferredLocation.name}`
                  : ""}
              </p>
            </div>
            {(customer.tags?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap justify-center gap-1 sm:justify-start">
                {customer.tags.slice(0, 6).map((tag, i) => (
                  <TagBadge key={tag} tag={tag} index={i} />
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap justify-center gap-3 text-xs sm:justify-start">
              <span className="text-muted-foreground">
                Next:{" "}
                {nextUpcoming
                  ? `${format(parseISO(nextUpcoming.start_time), "MMM d")} · ${nextUpcoming.service?.name ?? "Appointment"}`
                  : "None scheduled"}
              </span>
              {outstanding > 0 ? (
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  Balance due {formatMoneyCents(outstanding, currency)}
                </span>
              ) : null}
            </div>
            <div className="pt-1">
              <CustomerQuickActions
                hasUpcoming={Boolean(nextUpcoming)}
                hasOutstanding={outstanding > 0}
                busy={actionBusy}
                onBook={openBook}
                onReschedule={openReschedule}
                onCancel={cancelNext}
                onCollectPayment={() => setCollectOpen(true)}
                onMessage={() => setTab("communication")}
                onEmail={() => {
                  if (customer.email) {
                    window.location.href = `mailto:${customer.email}`;
                  } else {
                    setTab("communication");
                  }
                }}
                onPrint={() => window.print()}
                onOpenTimeline={() => setTab("timeline")}
                onAskSummer={() => setTab("spark")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <CustomerPaymentSummary account={commerceAccount} currency={currency} />

      {chaseHints.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-border bg-muted/20 px-4 py-3 print:hidden">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recommendations (from observed visits)
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {chaseHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className="-mx-1 flex gap-1 overflow-x-auto pb-1 print:hidden"
        role="tablist"
        aria-label="Customer workspace sections"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`min-h-11 shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tab === item.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <CustomerOverviewRead
          profile={profile}
          staff={staff}
          locations={locations}
          memberships={memberships}
        />
      ) : null}

      {tab === "timeline" ? (
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerTimeline
              items={profile.timeline}
              onAddNote={() => setTab("notes")}
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "appointments" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {(profile.appointments.needsAttention?.length ?? 0) > 0 ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Needs attention</CardTitle>
              <p className="text-xs font-normal text-muted-foreground">
                Scheduled time has passed and the visit is still Booked — mark
                completed, no-show, or cancel. Not counted as a completed last
                visit.
              </p>
            </CardHeader>
            <CardContent>
              <AppointmentList
                items={profile.appointments.needsAttention}
                emptyTitle="Nothing needs attention"
                emptyDescription=""
                currency={currency}
                onOpenBilling={() => setTab("billing")}
              />
            </CardContent>
          </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                items={profile.appointments.upcoming}
                emptyTitle="No upcoming appointments"
                emptyDescription="Book the next visit from Quick Actions."
                currency={currency}
                onOpenBilling={() => setTab("billing")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                items={profile.appointments.completed}
                emptyTitle="No completed visits"
                emptyDescription="Completed appointments appear here after visits finish."
                currency={currency}
                onOpenBilling={() => setTab("billing")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                items={profile.appointments.cancelled}
                emptyTitle="No cancellations"
                emptyDescription="Cancelled appointments appear here."
                currency={currency}
                onOpenBilling={() => setTab("billing")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>No-shows</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                items={profile.appointments.noShows}
                emptyTitle="No no-shows"
                emptyDescription="No-show appointments appear here."
                currency={currency}
                onOpenBilling={() => setTab("billing")}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "communication" ? (
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {(profile.communications.history?.length ?? 0) === 0 &&
            (profile.communications.emailHistory?.length ?? 0) === 0 &&
            (profile.communications.smsHistory?.length ?? 0) === 0 ? (
              <div className="space-y-3">
                <EmptyState
                  variant="panel"
                  glyph={MessageSquare}
                  title="No customer messages yet"
                  description="Customer-specific message history appears after email or SMS is sent from Chasum. Phone logs are not available yet."
                />
                <CommunicationCenter
                  customer={{
                    id: customer.id,
                    name: displayName,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address,
                    notes: customer.notes,
                  }}
                  mapsAddress={mapsAddress}
                  bundle={profile.communications}
                  smsAllowed={smsAllowed}
                  smsBlockedReason={smsBlockedReason}
                />
              </div>
            ) : (
              <CommunicationCenter
                customer={{
                  id: customer.id,
                  name: displayName,
                  email: customer.email,
                  phone: customer.phone,
                  address: customer.address,
                  notes: customer.notes,
                }}
                mapsAddress={mapsAddress}
                bundle={profile.communications}
                smsAllowed={smsAllowed}
                smsBlockedReason={smsBlockedReason}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "documents" ? (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerDocumentsPanel
              customerId={customer.id}
              documents={profile.documents}
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "notes" ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerNotesPanel
              customerId={customer.id}
              notes={profile.notes}
              profileNotes={customer.notes}
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "billing" ? (
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerCommercePanel
              customerId={customer.id}
              account={commerceAccount}
              currency={currency}
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "insights" ? (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerInsightsPanel insights={profile.insights} currency={currency} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "marketing" ? (
        <Card>
          <CardHeader>
            <CardTitle>Marketing & loyalty</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerMarketingForm
              profile={profile}
              memberships={memberships}
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "spark" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Summer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Summer is the AI Business Manager (Early Access). Facts below are
              grounded in this customer’s recorded data. Recommendations never
              run automatically.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <section className="rounded-[var(--radius-md)] border border-border bg-muted/15 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Observed facts
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {observedFacts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-[var(--radius-md)] border border-dashed border-border px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Recommendations
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional suggestions only — require your approval. Summer does
                  not send messages or change customer data here.
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {chaseHints.length > 0 ? (
                    chaseHints.map((hint) => <li key={hint}>{hint}</li>)
                  ) : outstanding > 0 ? (
                    <li>Consider sending a payment reminder.</li>
                  ) : (
                    <li>No recommendations from current observed visits.</li>
                  )}
                </ul>
              </section>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={sparkPending}
                onClick={() => {
                  startSpark(async () => {
                    const result = await sparkCrmQueryAction({
                      kind: "summarize_customer",
                      customerId: customer.id,
                    });
                    setSparkResult(result.summary);
                  });
                }}
              >
                Summarize for Summer
              </Button>
            </div>
            {sparkResult ? (
              <p className="rounded-[var(--radius-md)] border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                {sparkResult}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <BookingSheet
        key={
          sheetAppointment?.id ??
          `crm-new-${customer.id}-${sheetOpen ? "open" : "closed"}`
        }
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetAppointment(null);
        }}
        appointment={sheetAppointment}
        services={services}
        staff={staff}
        customers={customers}
        locations={locations}
        defaultCustomerId={customer.id}
        defaultStaffId={customer.assigned_staff_id ?? undefined}
        channel="staff"
        onSuccess={() => {
          setSheetOpen(false);
          setSheetAppointment(null);
          refresh();
        }}
        onViewCreatedAppointment={async (id) => {
          const appt = await getCrmAppointmentForBooking(id);
          if (!appt) {
            throw new Error("Appointment not found");
          }
          setSheetAppointment(appt);
          setSheetOpen(true);
          refresh();
        }}
      />
      <CollectPaymentWorkspace
        open={collectOpen}
        onClose={() => setCollectOpen(false)}
        currency={currency}
        initialCustomerId={customer.id}
        initialCustomerName={displayName}
        seedCustomers={customers}
      />
    </div>
  );
}
