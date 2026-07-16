"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelFollowUpAction,
  completeFollowUpAction,
  createFollowUpAction,
} from "@/lib/actions/communications";
import type { FollowUpReminder } from "@/lib/communication/types";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { format } from "date-fns";
import { Bell, Check, X } from "lucide-react";
import { useActionState, useTransition } from "react";

export function FollowUpRemindersPanel({
  customerId,
  followUps,
}: {
  customerId: string;
  followUps: FollowUpReminder[];
}) {
  const [state, formAction, pending] = useActionState(
    createFollowUpAction,
    {} as ActionState,
  );
  const refresh = useRefresh();
  const { toast } = useToast();
  const [actionPending, startTransition] = useTransition();

  useFormAction(state, undefined, () => refresh());

  const pendingItems = followUps.filter((item) => item.status === "pending");
  const pastItems = followUps.filter((item) => item.status !== "pending");

  function complete(id: string) {
    startTransition(async () => {
      const result = await completeFollowUpAction(id, customerId);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Completed.", "success");
        refresh();
      }
    });
  }

  function cancel(id: string) {
    startTransition(async () => {
      const result = await cancelFollowUpAction(id, customerId);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Cancelled.", "success");
        refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {pendingItems.length === 0 && pastItems.length === 0 ? (
        <EmptyState
          variant="panel"
          glyph={Bell}
          title="No follow-up reminders"
          description="Schedule a reminder to follow up with this client."
        />
      ) : (
        <ul className="divide-y divide-border/80">
          {pendingItems.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                {item.body ? (
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Due {format(new Date(item.dueAt), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={actionPending}
                  onClick={() => complete(item.id)}
                  aria-label="Complete follow-up"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  disabled={actionPending}
                  onClick={() => cancel(item.id)}
                  aria-label="Cancel follow-up"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
          {pastItems.map((item) => (
            <li key={item.id} className="py-3 opacity-70 first:pt-0 last:pb-0">
              <p className="text-sm font-medium">
                {item.title}{" "}
                <span className="text-xs capitalize text-muted-foreground">
                  ({item.status})
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Was due {format(new Date(item.dueAt), "MMM d, yyyy")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        action={formAction}
        className="space-y-3 rounded-[var(--radius-md)] border border-dashed border-border p-4"
      >
        <input type="hidden" name="customer_id" value={customerId} />
        <div className="space-y-2">
          <Label htmlFor="follow_title">Follow-up title</Label>
          <Input
            id="follow_title"
            name="title"
            placeholder="Call about reschedule…"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="follow_due">Due</Label>
          <Input
            id="follow_due"
            name="due_at"
            type="datetime-local"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="follow_body">Notes (optional)</Label>
          <Textarea id="follow_body" name="body" rows={2} />
        </div>
        <AlertMessage error={state.error} success={state.success} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Add follow-up"}
        </Button>
      </form>
    </div>
  );
}
