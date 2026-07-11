"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/page-header";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "@/lib/actions/customers";
import type { ActionState, Customer } from "@/lib/types/booking";
import { TagBadge } from "@/components/ui/badge";
import Link from "next/link";
import { Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

function CustomerForm({
  customer,
  onClose,
  onSuccess,
}: {
  customer?: Customer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const action = customer ? updateCustomer : createCustomer;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      onSuccess();
      onClose();
    }
  }, [state.success, onSuccess, onClose]);

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
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : customer ? "Update" : "Add"}</Button>
      </div>
    </form>
  );
}

export function CustomersManager({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();
  const [search, setSearch] = useState("");

  function refresh() {
    window.location.reload();
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
        />
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add client
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "No clients found" : "No clients yet"}
          description={search ? "Try a different search term." : "Clients will appear here when you add them or receive bookings."}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((customer) => (
            <Card key={customer.id} className="border-border/60">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <Link href={`/dashboard/clients/${customer.id}`} className="font-semibold hover:text-primary">
                    {customer.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{customer.email}</span>
                    {customer.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{customer.phone}</span>}
                  </div>
                  {customer.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(customer.tags ?? []).map((tag, i) => (
                        <TagBadge key={tag} tag={tag} index={i} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditing(customer); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={async () => {
                    if (confirm("Delete this client?")) {
                      await deleteCustomer(customer.id);
                      refresh();
                    }
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit client" : "Add client"}>
        <CustomerForm customer={editing} onClose={() => setOpen(false)} onSuccess={refresh} />
      </Dialog>
    </div>
  );
}
