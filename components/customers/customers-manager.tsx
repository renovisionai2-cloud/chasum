"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/page-header";
import { TagBadge } from "@/components/ui/badge";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
  type CustomerCreateState,
} from "@/lib/actions/customers";
import {
  ACKNOWLEDGED_CONTACT_FIELD,
  contactIdentityKey,
  customerEmailLabel,
  SHARED_PHONE_WARNING,
} from "@/lib/customers/contact-identity";
import type { Customer } from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import Link from "next/link";
import { Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useRef, useState } from "react";

function CustomerForm({
  customer,
  onClose,
}: {
  customer?: Customer;
  onClose: () => void;
}) {
  const action: (
    prev: CustomerCreateState,
    formData: FormData,
  ) => Promise<CustomerCreateState> = customer ? updateCustomer : createCustomer;
  const [state, formAction, pending] = useActionState(
    action,
    {} as CustomerCreateState,
  );
  const [contact, setContact] = useState({
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
  });

  // The warning belongs to the contact that produced it. Editing the phone or
  // email makes the chooser disappear, so an old candidate can never be used
  // for a different number — including when a slow response arrives late.
  const returnedMatches = state.phoneMatches ?? [];
  const warnedForCurrentContact =
    returnedMatches.length > 0 &&
    state.warnedContactKey === contactIdentityKey(contact);
  const staleWarning = returnedMatches.length > 0 && !warnedForCurrentContact;

  useFormAction(
    returnedMatches.length > 0 ? { ...state, error: undefined } : state,
    undefined,
    onClose,
  );

  // The acknowledgement is attached only by an explicit "Create a separate
  // person" click, so an ordinary save — including an Enter keypress — always
  // re-checks the phone instead of reusing an earlier authorisation.
  // Submitting inside a transition keeps the operator's typed values on screen
  // while the shared-phone chooser is answered.
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(() => formAction(formData));
  }

  function createSeparatePerson() {
    if (!formRef.current || !state.warnedContactKey) return;
    const formData = new FormData(formRef.current);
    formData.set(ACKNOWLEDGED_CONTACT_FIELD, state.warnedContactKey);
    submit(formData);
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="space-y-4"
    >
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={customer?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={contact.email}
          onChange={(e) =>
            setContact((c) => ({ ...c, email: e.target.value }))
          }
          aria-describedby="client-contact-hint"
        />
        <p id="client-contact-hint" className="text-xs text-muted-foreground">
          Add an email or a phone number so you can reach this customer. Either one is enough.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={contact.phone}
          onChange={(e) =>
            setContact((c) => ({ ...c, phone: e.target.value }))
          }
          aria-describedby="client-contact-hint"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          placeholder="Street, city, state…"
          defaultValue={customer?.address ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="referral_source">Referral source</Label>
        <Input
          id="referral_source"
          name="referral_source"
          placeholder="Google, Instagram, friend referral…"
          defaultValue={customer?.referral_source ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" name="tags" placeholder="VIP, Regular, New" defaultValue={customer?.tags?.join(", ") ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} />
      </div>
      {warnedForCurrentContact ? (
        <div
          className="space-y-2 rounded-[var(--radius-md)] border border-border bg-muted/20 p-2"
          role="status"
        >
          <p className="text-xs text-muted-foreground">{SHARED_PHONE_WARNING}</p>
          <ul className="space-y-2">
            {returnedMatches.map((match) => (
              <li
                key={match.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 truncate text-sm">
                  {match.name}
                  <span className="text-muted-foreground">
                    {" "}
                    · {customerEmailLabel(match.email)}
                    {match.phone ? ` · ${match.phone}` : ""}
                  </span>
                </span>
                <Link
                  href={`/dashboard/clients/${match.id}`}
                  className="ds-focus-ring inline-flex h-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-card/60 px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
                >
                  Use this customer
                </Link>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={createSeparatePerson}
          >
            Create separate person
          </Button>
        </div>
      ) : staleWarning ? (
        <p className="text-xs text-muted-foreground" role="status">
          The contact details changed, so the earlier shared-phone match no
          longer applies. Save again to check the new number.
        </p>
      ) : null}
      <AlertMessage error={warnedForCurrentContact ? undefined : state.error} />
      <FormFooter onCancel={onClose} pending={pending} submitLabel={customer ? "Update" : "Add"} />
    </form>
  );
}

export function CustomersManager({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();
  const [search, setSearch] = useState("");
  const refresh = useRefresh();
  const { toast } = useToast();

  async function handleDelete(id: string, name: string) {
    if (!(await confirmDelete(`Delete ${name}?`))) return;
    const result = await deleteCustomer(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Client deleted.", "success");
      refresh();
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          aria-label="Search clients"
        />
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add client
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "No clients found" : "No clients yet"}
          description={
            search
              ? "Try a different search term."
              : "Clients appear when you add them or receive bookings."
          }
        >
          {!search && (
            <Button
              onClick={() => {
                setEditing(undefined);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add client
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {filtered.map((customer) => (
            <Card key={customer.id} className="ds-card-interactive">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/dashboard/clients/${customer.id}`} className="font-semibold hover:text-primary">
                    {customer.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{customerEmailLabel(customer.email)}</span>
                    {customer.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{customer.phone}</span>}
                  </div>
                  {customer.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(customer.tags ?? []).map((tag, i) => (
                        <TagBadge key={tag} tag={tag} index={i} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconButton label={`Edit ${customer.name}`} onClick={() => { setEditing(customer); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={`Delete ${customer.name}`} className="text-destructive hover:text-destructive" onClick={() => handleDelete(customer.id, customer.name)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit client" : "Add client"}>
        <CustomerForm customer={editing} onClose={() => setOpen(false)} />
      </Dialog>
    </div>
  );
}
