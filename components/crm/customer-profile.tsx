"use client";

import { BookingSheet } from "@/components/booking-sheet";
import { CommunicationCenter } from "@/components/communication/communication-center";
import { CustomerInsightsPanel } from "@/components/crm/customer-insights";
import { CustomerNotesPanel } from "@/components/crm/customer-notes-panel";
import { CustomerQuickActions } from "@/components/crm/customer-quick-actions";
import { CustomerTimeline } from "@/components/crm/customer-timeline";
import { CustomerDocumentsPanel } from "@/components/customers/customer-documents-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, TagBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cancelAppointment } from "@/lib/actions/appointments";
import {
  getCrmAppointmentForBooking,
  recordCrmPaymentAction,
  sparkCrmQueryAction,
  updateCrmCustomer,
} from "@/lib/actions/crm";
import type { Membership } from "@/lib/business/types";
import { chaseHintsFromInsights } from "@/lib/crm/chase-hints";
import { displayCustomerName } from "@/lib/crm/display";
import {
  COMM_METHOD_LABELS,
  CRM_STATUS_LABELS,
  LOYALTY_STATUS_LABELS,
  type CrmProfile,
} from "@/lib/crm/types";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import type {
  ActionState,
  AppointmentWithRelations,
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { format } from "date-fns";
import { Calendar, Sparkles } from "lucide-react";
import Image from "next/image";
import { useActionState, useState, useTransition } from "react";

type TabKey =
  | "overview"
  | "timeline"
  | "appointments"
  | "communication"
  | "documents"
  | "notes"
  | "insights"
  | "marketing"
  | "spark";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "timeline", label: "Timeline" },
  { key: "appointments", label: "Appointments" },
  { key: "communication", label: "Communication" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "insights", label: "Insights" },
  { key: "marketing", label: "Marketing" },
  { key: "spark", label: "Summer / Chase" },
];

function AppointmentList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: CrmProfile["appointments"]["upcoming"];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        variant="panel"
        glyph={Calendar}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="divide-y divide-border/80">
      {items.map((appt) => (
        <li
          key={appt.id}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {appt.service?.name ?? "Service"}
              {appt.recurring_rule_id ? " · Recurring" : ""}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {format(parseISO(appt.start_time), "MMM d, yyyy")} at{" "}
              {formatTime(parseISO(appt.start_time))}
              {appt.staff?.name ? ` · ${appt.staff.name}` : ""}
              {appt.location?.name ? ` · ${appt.location.name}` : ""}
            </p>
          </div>
          <StatusBadge status={appt.status} />
        </li>
      ))}
    </ul>
  );
}

export function CustomerProfileView({
  profile,
  staff,
  locations,
  services,
  customers,
  memberships,
  mapsAddress,
}: {
  profile: CrmProfile;
  staff: StaffWithServices[];
  locations: Location[];
  services: Service[];
  customers: Customer[];
  memberships: Membership[];
  mapsAddress?: string | null;
}) {
  const { customer } = profile;
  const [tab, setTab] = useState<TabKey>("overview");
  const [state, formAction, pending] = useActionState(
    updateCrmCustomer,
    {} as ActionState,
  );
  const [payState, payAction, payPending] = useActionState(
    recordCrmPaymentAction,
    {} as ActionState,
  );
  const [sparkPending, startSpark] = useTransition();
  const [actionBusy, startAction] = useTransition();
  const [sparkResult, setSparkResult] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetAppointment, setSheetAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const refresh = useRefresh();
  const { toast } = useToast();
  useFormAction(state, () => refresh());
  useFormAction(payState, () => refresh());

  const displayName = displayCustomerName(customer);
  const nextUpcoming = profile.appointments.upcoming[0] ?? null;
  const chaseHints = chaseHintsFromInsights(profile.insights);

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
    <div className="space-y-6">
      <Card className="print:shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:mx-0">
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
          <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
            <h2 className="truncate text-xl font-semibold tracking-tight">
              {displayName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {CRM_STATUS_LABELS[
                (customer.crm_status as keyof typeof CRM_STATUS_LABELS) ??
                  "active"
              ] ?? "Active"}
              {profile.assignedStaff?.name
                ? ` · Preferred: ${profile.assignedStaff.name}`
                : ""}
              {profile.membership?.name
                ? ` · ${profile.membership.name}`
                : ""}
              {customer.is_vip ? " · VIP" : ""}
              {customer.marketing_consent ? " · Marketing OK" : ""}
            </p>
            {(customer.tags?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap justify-center gap-1 pt-1 sm:justify-start">
                {customer.tags.map((tag, i) => (
                  <TagBadge key={tag} tag={tag} index={i} />
                ))}
              </div>
            ) : null}
            <div className="pt-2">
              <CustomerQuickActions
                hasUpcoming={Boolean(nextUpcoming)}
                busy={actionBusy}
                onBook={openBook}
                onReschedule={openReschedule}
                onCancel={cancelNext}
                onCollectPayment={() => setTab("insights")}
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

      {chaseHints.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-border bg-muted/20 px-4 py-3 print:hidden">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Chase
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {chaseHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 print:hidden">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "timeline" ? (
        <Card>
          <CardHeader>
            <CardTitle>Customer timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerTimeline items={profile.timeline} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "appointments" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                items={profile.appointments.upcoming}
                emptyTitle="No upcoming appointments"
                emptyDescription="Book the next visit with Quick Actions."
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
                emptyDescription="Completed appointments appear here."
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
              />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Booking history</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerInsightsPanel insights={profile.insights} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "communication" ? (
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
        />
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

      {tab === "insights" ? (
        <Card>
          <CardHeader>
            <CardTitle>Customer insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CustomerInsightsPanel insights={profile.insights} />
            <form
              action={payAction}
              className="space-y-3 rounded-[var(--radius-md)] border border-dashed border-border p-4"
            >
              <p className="ds-label">Collect payment</p>
              <input type="hidden" name="customer_id" value={customer.id} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Input name="amount" placeholder="Amount" required />
                <Input name="method" placeholder="Method (card, cash…)" />
                <Input name="description" placeholder="Description" />
              </div>
              <AlertMessage error={payState.error} success={payState.success} />
              <Button type="submit" size="sm" disabled={payPending}>
                {payPending ? "Saving…" : "Record payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {tab === "spark" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Summer & Chase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Summer reads CRM history and preferences (never writes). Chase
              surfaces retention and follow-up signals. Booking changes still go
              through the Booking Engine.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["summarize_customer", "Summarize for Summer"],
                  ["inactive_customers", "Chase · Inactive"],
                  ["top_spenders", "Chase · High value"],
                  ["birthday_promotions", "Chase · Birthday"],
                ] as const
              ).map(([kind, label]) => (
                <Button
                  key={kind}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sparkPending}
                  onClick={() => {
                    startSpark(async () => {
                      const result = await sparkCrmQueryAction({
                        kind,
                        customerId: customer.id,
                      });
                      setSparkResult(result.summary);
                    });
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            {sparkResult ? (
              <p className="rounded-[var(--radius-md)] border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                {sparkResult}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {(tab === "overview" || tab === "marketing") && (
        <Card>
          <CardHeader>
            <CardTitle>
              {tab === "overview" ? "Profile" : "Marketing & loyalty"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-5">
              <input type="hidden" name="id" value={customer.id} />

              {tab === "overview" ? (
                <>
                  <ImageUploadField
                    id="photo_url"
                    name="photo_url"
                    label="Profile photo"
                    folder="customer-photos"
                    defaultValue={customer.photo_url}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First name</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        defaultValue={customer.first_name ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last name</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        defaultValue={customer.last_name ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_name">Preferred name</Label>
                      <Input
                        id="preferred_name"
                        name="preferred_name"
                        defaultValue={customer.preferred_name ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={customer.email}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={customer.phone ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Birthday</Label>
                      <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        defaultValue={customer.date_of_birth ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender (optional)</Label>
                      <Input
                        id="gender"
                        name="gender"
                        defaultValue={customer.gender ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_communication_method">
                        Preferred communication
                      </Label>
                      <Select
                        id="preferred_communication_method"
                        name="preferred_communication_method"
                        defaultValue={
                          customer.preferred_communication_method ?? "any"
                        }
                      >
                        {Object.entries(COMM_METHOD_LABELS).map(
                          ([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ),
                        )}
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        defaultValue={customer.address ?? ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
                    <p className="ds-label">Emergency contact</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Input
                        name="emergency_contact_name"
                        placeholder="Name"
                        defaultValue={customer.emergency_contact_name ?? ""}
                      />
                      <Input
                        name="emergency_contact_phone"
                        placeholder="Phone"
                        defaultValue={customer.emergency_contact_phone ?? ""}
                      />
                      <Input
                        name="emergency_contact_relationship"
                        placeholder="Relationship"
                        defaultValue={
                          customer.emergency_contact_relationship ?? ""
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="crm_status">Status</Label>
                      <Select
                        id="crm_status"
                        name="crm_status"
                        defaultValue={customer.crm_status ?? "active"}
                      >
                        {Object.entries(CRM_STATUS_LABELS).map(
                          ([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ),
                        )}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assigned_staff_id">
                        Preferred employee
                      </Label>
                      <Select
                        id="assigned_staff_id"
                        name="assigned_staff_id"
                        defaultValue={customer.assigned_staff_id ?? ""}
                      >
                        <option value="">Unassigned</option>
                        {staff.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_location_id">
                        Preferred location
                      </Label>
                      <Select
                        id="preferred_location_id"
                        name="preferred_location_id"
                        defaultValue={customer.preferred_location_id ?? ""}
                      >
                        <option value="">None</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="membership_id">Membership</Label>
                      <Select
                        id="membership_id"
                        name="membership_id"
                        defaultValue={customer.membership_id ?? ""}
                      >
                        <option value="">None</option>
                        {memberships.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <input
                    type="hidden"
                    name="is_vip"
                    value={customer.is_vip ? "true" : "false"}
                  />
                  <input
                    type="hidden"
                    name="marketing_consent"
                    value={customer.marketing_consent ? "true" : "false"}
                  />
                  <input
                    type="hidden"
                    name="tags"
                    value={(customer.tags ?? []).join(", ")}
                  />
                  <input
                    type="hidden"
                    name="loyalty_status"
                    value={customer.loyalty_status ?? "standard"}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="notes">Profile notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      defaultValue={customer.notes ?? ""}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        name="tags"
                        defaultValue={(customer.tags ?? []).join(", ")}
                        placeholder="VIP, Regular, New"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referral_source">Referral source</Label>
                      <Input
                        id="referral_source"
                        name="referral_source"
                        defaultValue={customer.referral_source ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loyalty_status">Loyalty status</Label>
                      <Select
                        id="loyalty_status"
                        name="loyalty_status"
                        defaultValue={customer.loyalty_status ?? "standard"}
                      >
                        {Object.entries(LOYALTY_STATUS_LABELS).map(
                          ([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ),
                        )}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="membership_id_mkt">Membership</Label>
                      <Select
                        id="membership_id_mkt"
                        name="membership_id"
                        defaultValue={customer.membership_id ?? ""}
                      >
                        <option value="">None</option>
                        {memberships.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="anniversary_date">Anniversary</Label>
                      <Input
                        id="anniversary_date"
                        name="anniversary_date"
                        type="date"
                        defaultValue={customer.anniversary_date ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth_mkt">Birthday</Label>
                      <Input
                        id="date_of_birth_mkt"
                        name="date_of_birth"
                        type="date"
                        defaultValue={customer.date_of_birth ?? ""}
                      />
                    </div>
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                      <input
                        type="checkbox"
                        name="is_vip"
                        defaultChecked={Boolean(customer.is_vip)}
                      />
                      VIP customer
                    </label>
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                      <input
                        type="checkbox"
                        name="marketing_consent"
                        defaultChecked={Boolean(customer.marketing_consent)}
                      />
                      Marketing consent
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Marketing consent gates promotional email/SMS. Summer reads
                    preferences; Chase ranks retention opportunities.
                  </p>
                  <input
                    type="hidden"
                    name="first_name"
                    value={customer.first_name ?? ""}
                  />
                  <input
                    type="hidden"
                    name="last_name"
                    value={customer.last_name ?? ""}
                  />
                  <input
                    type="hidden"
                    name="preferred_name"
                    value={customer.preferred_name ?? ""}
                  />
                  <input type="hidden" name="email" value={customer.email} />
                  <input
                    type="hidden"
                    name="phone"
                    value={customer.phone ?? ""}
                  />
                  <input
                    type="hidden"
                    name="address"
                    value={customer.address ?? ""}
                  />
                  <input
                    type="hidden"
                    name="photo_url"
                    value={customer.photo_url ?? ""}
                  />
                  <input
                    type="hidden"
                    name="crm_status"
                    value={customer.crm_status ?? "active"}
                  />
                  <input
                    type="hidden"
                    name="assigned_staff_id"
                    value={customer.assigned_staff_id ?? ""}
                  />
                  <input
                    type="hidden"
                    name="preferred_location_id"
                    value={customer.preferred_location_id ?? ""}
                  />
                  <input
                    type="hidden"
                    name="preferred_communication_method"
                    value={customer.preferred_communication_method ?? "any"}
                  />
                  <input
                    type="hidden"
                    name="notes"
                    value={customer.notes ?? ""}
                  />
                </>
              )}

              <AlertMessage error={state.error} success={state.success} />
              <FormFooter pending={pending} submitLabel="Save profile" />
            </form>
          </CardContent>
        </Card>
      )}

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
      />
    </div>
  );
}
