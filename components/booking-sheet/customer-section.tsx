"use client";

import { CustomerSearch } from "@/components/reception/customer-search";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { getBookingSheetCustomerSnapshot } from "@/lib/actions/booking-sheet";
import {
  quickCreateCustomer,
  updateCustomer,
} from "@/lib/actions/customers";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { useFormAction } from "@/hooks/use-form-action";
import { pushRecentCustomer } from "@/lib/reception/recent-customers";
import type { ActionState, Customer } from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Cake,
  FileText,
  Mail,
  Pencil,
  Phone,
  Plus,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { useActionState, useState, useTransition } from "react";

type Snapshot = NonNullable<
  Awaited<ReturnType<typeof getBookingSheetCustomerSnapshot>>
>;

type CustomerSectionProps = {
  customers: Customer[];
  selected: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onCustomersChange: (customers: Customer[]) => void;
  snapshot: Snapshot | null;
  snapshotLoading: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function EditCustomerDialog({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer;
  onClose: () => void;
  onSaved: (next: Customer) => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateCustomer,
    {} as ActionState,
  );

  useFormAction(state, () => {
    const form = document.getElementById(
      "bs-edit-customer-form",
    ) as HTMLFormElement | null;
    if (!form) {
      onClose();
      return;
    }
    const fd = new FormData(form);
    const tagsRaw = String(fd.get("tags") ?? "");
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSaved({
      ...customer,
      name: String(fd.get("name") ?? customer.name).trim(),
      email: String(fd.get("email") ?? customer.email).trim(),
      phone: String(fd.get("phone") ?? "").trim() || null,
      address: String(fd.get("address") ?? "").trim() || null,
      notes: String(fd.get("notes") ?? "").trim() || null,
      referral_source: String(fd.get("referral_source") ?? "").trim() || null,
      tags,
      updated_at: new Date().toISOString(),
    });
    onClose();
  });

  return (
    <Dialog open onClose={onClose} title="Edit customer">
      <form id="bs-edit-customer-form" action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={customer.id} />
        <div className="space-y-2">
          <Label htmlFor="bs-edit-name">Name</Label>
          <Input
            id="bs-edit-name"
            name="name"
            defaultValue={customer.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bs-edit-email">Email</Label>
          <Input
            id="bs-edit-email"
            name="email"
            type="email"
            defaultValue={customer.email}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bs-edit-phone">Phone</Label>
          <Input
            id="bs-edit-phone"
            name="phone"
            type="tel"
            defaultValue={customer.phone ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bs-edit-address">Address</Label>
          <Input
            id="bs-edit-address"
            name="address"
            defaultValue={customer.address ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bs-edit-referral">Referral source</Label>
          <Input
            id="bs-edit-referral"
            name="referral_source"
            defaultValue={customer.referral_source ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bs-edit-tags">Tags (comma-separated)</Label>
          <Input
            id="bs-edit-tags"
            name="tags"
            defaultValue={(customer.tags ?? []).join(", ")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bs-edit-notes">Notes</Label>
          <Textarea
            id="bs-edit-notes"
            name="notes"
            defaultValue={customer.notes ?? ""}
          />
        </div>
        <AlertMessage error={state.error} />
        <FormFooter
          onCancel={onClose}
          pending={pending}
          submitLabel="Save customer"
        />
      </form>
    </Dialog>
  );
}

export function CustomerSection({
  customers,
  selected,
  onSelect,
  onCustomersChange,
  snapshot,
  snapshotLoading,
}: CustomerSectionProps) {
  const { toast } = useToast();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState({ name: "", email: "", phone: "" });

  function handleSelect(c: Customer) {
    pushRecentCustomer(c);
    onSelect(c);
    setShowQuickAdd(false);
  }

  function handleQuickAdd() {
    if (!draft.name.trim()) {
      toast("First and last name help identify the guest.", "error");
      return;
    }
    startTransition(async () => {
      const result = await quickCreateCustomer(draft);
      if (result.error || !result.customerId) {
        toast(result.error ?? "Could not add customer.", "error");
        return;
      }
      const created: Customer = {
        id: result.customerId,
        business_id: "",
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || null,
        notes: null,
        tags: [],
        referral_source: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onCustomersChange(
        [...customers, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      handleSelect(created);
      setDraft({ name: "", email: "", phone: "" });
      toast(result.success ?? "Customer added.", "success");
    });
  }

  return (
    <section className="space-y-4" aria-labelledby="bs-customer-heading">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h3
            id="bs-customer-heading"
            className="text-sm font-semibold tracking-tight"
          >
            Customer
          </h3>
          <p className="text-xs text-muted-foreground">
            Search, select, or quick-add — keyboard first
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowQuickAdd((v) => !v)}
        >
          <Plus className="size-3.5" />
          Quick add
        </Button>
      </div>

      <CustomerSearch
        selectedId={selected?.id}
        seedCustomers={customers}
        autoFocus={!selected}
        onSelect={handleSelect}
      />

      {showQuickAdd ? (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-muted/20 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bs-qc-name">Name</Label>
              <Input
                id="bs-qc-name"
                data-sheet-autofocus
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-qc-email">Email</Label>
              <Input
                id="bs-qc-email"
                type="email"
                value={draft.email}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-qc-phone">Phone</Label>
              <Input
                id="bs-qc-phone"
                value={draft.phone}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={handleQuickAdd}
          >
            Save customer
          </Button>
        </div>
      ) : null}

      {selected ? (
        <div className="rounded-[var(--radius-md)] border border-border bg-card p-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              aria-hidden
            >
              {selected.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.photo_url}
                  alt=""
                  className="size-11 rounded-full object-cover"
                />
              ) : (
                initials(selected.name || "?")
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{selected.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {selected.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" aria-hidden />
                    {selected.phone}
                  </span>
                ) : null}
                {selected.email ? (
                  <span className="inline-flex items-center gap-1 truncate">
                    <Mail className="size-3" aria-hidden />
                    {selected.email}
                  </span>
                ) : null}
                {selected.date_of_birth ? (
                  <span className="inline-flex items-center gap-1">
                    <Cake className="size-3" aria-hidden />
                    {format(parseISO(selected.date_of_birth), "MMM d")}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {selected.is_vip ? (
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
                    VIP
                  </span>
                ) : null}
                {selected.loyalty_status ? (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {selected.loyalty_status}
                  </span>
                ) : null}
                {(selected.tags ?? []).slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {selected.notes?.trim() ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px]">
                    <FileText className="size-2.5" aria-hidden />
                    Notes
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onSelect(null)}
              >
                Change
              </Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Last visit
              </p>
              <p className="text-xs font-medium">
                {snapshotLoading
                  ? "…"
                  : snapshot?.lastVisit
                    ? format(parseISO(snapshot.lastVisit), "MMM d")
                    : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Upcoming
              </p>
              <p className="text-xs font-medium">
                {snapshotLoading ? "…" : (snapshot?.upcomingCount ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Balance
              </p>
              <p
                className={cn(
                  "inline-flex items-center justify-center gap-0.5 text-xs font-medium",
                  (snapshot?.outstandingBalanceCount ?? 0) > 0 &&
                    "text-amber-700 dark:text-amber-300",
                )}
              >
                <Wallet className="size-3" aria-hidden />
                {snapshotLoading
                  ? "…"
                  : snapshot?.outstandingBalanceCount
                    ? `${snapshot.outstandingBalanceCount} due`
                    : "Clear"}
              </p>
            </div>
          </div>

          {snapshot?.upcoming && snapshot.upcoming.length > 0 ? (
            <ul className="mt-3 space-y-1.5 border-t border-border/70 pt-3">
              <li className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Timeline preview
              </li>
              {snapshot.upcoming.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate">
                    {format(parseISO(a.start), "MMM d")} ·{" "}
                    {formatTime(parseISO(a.start))} · {a.serviceName}
                  </span>
                  <span className="shrink-0 capitalize text-muted-foreground">
                    {a.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          <UserRound className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Select a customer to see membership, last visit, and upcoming visits.
            <span className="mt-1 block text-xs">
              <Sparkles className="mr-1 inline size-3 text-spark" aria-hidden />
              Summer can suggest regulars once activity exists.
            </span>
          </p>
        </div>
      )}

      {editOpen && selected ? (
        <EditCustomerDialog
          customer={selected}
          onClose={() => setEditOpen(false)}
          onSaved={(next) => {
            onSelect(next);
            onCustomersChange(
              customers
                .map((c) => (c.id === next.id ? next : c))
                .sort((a, b) => a.name.localeCompare(b.name)),
            );
            pushRecentCustomer(next);
          }}
        />
      ) : null}
    </section>
  );
}
