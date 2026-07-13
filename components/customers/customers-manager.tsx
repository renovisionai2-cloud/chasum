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
} from "@/lib/actions/customers";
import type { ActionState, Customer } from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import Link from "next/link";
import { Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

function CustomerForm({
  customer,
  onClose,
}: {
  customer?: Customer;
  onClose: () => void;
}) {
  const action = customer ? updateCustomer : createCustomer;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useFormAction(state, undefined, onClose);

  return (
    <form action={formAction} className="space-y-4">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={customer?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={customer?.email} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={customer?.phone ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" name="tags" placeholder="VIP, Regular, New" defaultValue={customer?.tags?.join(", ") ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} />
      </div>
      <AlertMessage error={state.error} />
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
      c.email.toLowerCase().includes(search.toLowerCase()),
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
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{customer.email}</span>
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
