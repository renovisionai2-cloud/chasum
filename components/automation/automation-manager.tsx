"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/page-header";
import {
  addToWaitlist,
  removeFromWaitlist,
} from "@/lib/actions/notifications";
import {
  createRecurringRule,
  toggleRecurringRule,
} from "@/lib/actions/notifications";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

type WaitlistRow = {
  id: string;
  preferred_date: string;
  status: string;
  customer: { name: string; email: string } | null;
  service: { name: string } | null;
  staff: { name: string } | null;
};

type RecurringRow = {
  id: string;
  frequency: string;
  start_date: string;
  start_time: string;
  active: boolean;
  service: { name: string } | null;
  staff: { name: string } | null;
  customer: { name: string } | null;
};

export function AutomationManager({
  waitlist,
  recurringRules,
  services,
  staff,
  customers,
}: {
  waitlist: WaitlistRow[];
  recurringRules: RecurringRow[];
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  customers: { id: string; name: string }[];
}) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [waitlistState, waitlistAction, waitlistPending] = useActionState(addToWaitlist, {} as ActionState);
  const [recurringState, recurringAction, recurringPending] = useActionState(createRecurringRule, {} as ActionState);
  const refresh = useRefresh();
  const { toast } = useToast();

  useFormAction(waitlistState, () => refresh(), () => setWaitlistOpen(false));
  useFormAction(recurringState, () => refresh(), () => setRecurringOpen(false));

  async function handleRemoveWaitlist(id: string) {
    const result = await removeFromWaitlist(id);
    toast(result.error ? result.error : (result.success ?? "Removed."), result.error ? "error" : "success");
    refresh();
  }

  async function handleToggleRule(id: string, active: boolean) {
    const result = await toggleRecurringRule(id, active);
    toast(result.error ? result.error : (result.success ?? "Updated."), result.error ? "error" : "success");
    refresh();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Waitlist</h2>
          <Button size="sm" onClick={() => setWaitlistOpen(true)}>
            <Plus className="h-4 w-4" /> Add to waitlist
          </Button>
        </div>
        {waitlist.filter((w) => w.status === "waiting" || w.status === "notified").length === 0 ? (
          <EmptyState title="Waitlist empty" description="Clients waiting for open slots will appear here." />
        ) : (
          <div className="space-y-2">
            {waitlist.filter((w) => w.status !== "cancelled").map((entry) => (
              <Card key={entry.id} className="border-border/60">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{entry.customer?.name} — {entry.service?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.preferred_date}
                      {entry.staff?.name && ` · ${entry.staff.name}`}
                      · {entry.status}
                    </p>
                  </div>
                  <IconButton label="Remove" className="text-destructive" onClick={() => handleRemoveWaitlist(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recurring appointments</h2>
          <Button size="sm" variant="outline" onClick={() => setRecurringOpen(true)}>
            <Plus className="h-4 w-4" /> Add rule
          </Button>
        </div>
        {recurringRules.length === 0 ? (
          <EmptyState title="No recurring rules" description="Automate repeating appointments for regular clients." />
        ) : (
          <div className="space-y-2">
            {recurringRules.map((rule) => (
              <Card key={rule.id} className="border-border/60">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{rule.customer?.name} — {rule.service?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {rule.frequency} from {rule.start_date} at {rule.start_time?.slice(0, 5)}
                      {rule.staff?.name && ` · ${rule.staff.name}`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleToggleRule(rule.id, !rule.active)}>
                    {rule.active ? "Pause" : "Activate"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={waitlistOpen} onClose={() => setWaitlistOpen(false)} title="Add to waitlist">
        <form action={waitlistAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wl_customer">Client</Label>
            <Select id="wl_customer" name="customer_id" required>
              <option value="">Select client</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl_service">Service</Label>
            <Select id="wl_service" name="service_id" required>
              <option value="">Select service</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl_date">Preferred date</Label>
            <Input id="wl_date" name="preferred_date" type="date" required />
          </div>
          <AlertMessage error={waitlistState.error} />
          <FormFooter onCancel={() => setWaitlistOpen(false)} pending={waitlistPending} submitLabel="Add" />
        </form>
      </Dialog>

      <Dialog open={recurringOpen} onClose={() => setRecurringOpen(false)} title="Create recurring rule">
        <form action={recurringAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select name="customer_id" required>
                <option value="">Select</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select name="service_id" required>
                <option value="">Select</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Staff</Label>
              <Select name="staff_id" required>
                <option value="">Select</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select name="frequency" defaultValue="weekly">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input name="start_time" type="time" required />
            </div>
          </div>
          <AlertMessage error={recurringState.error} />
          <FormFooter onCancel={() => setRecurringOpen(false)} pending={recurringPending} submitLabel="Create rule" />
        </form>
      </Dialog>
    </div>
  );
}
