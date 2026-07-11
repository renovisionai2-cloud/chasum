"use client";

import { createAvailabilityBlock, deleteAvailabilityBlock } from "@/lib/actions/availability";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import type { ActionState, Availability, Staff } from "@/lib/types/booking";
import { Trash2 } from "lucide-react";
import { useActionState } from "react";

function formatBlockRange(start: string, end: string) {
  return `${new Date(start).toLocaleString()} – ${new Date(end).toLocaleString()}`;
}

export function AvailabilityBlocksForm({
  blocks,
  staff,
}: {
  blocks: Availability[];
  staff: Staff[];
}) {
  const [state, formAction, pending] = useActionState(
    createAvailabilityBlock,
    {} as ActionState,
  );
  const refresh = useRefresh();
  const { toast } = useToast();

  useFormAction(state);

  async function handleDelete(id: string) {
    const result = await deleteAvailabilityBlock(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Time block removed.", "success");
      refresh();
    }
  }

  return (
    <Card className="border-border/60 lg:col-span-2">
      <CardHeader>
        <CardTitle>Blocked time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Block time for the whole business or a specific staff member. Blocked
          slots are removed from public booking and dashboard validation.
        </p>

        {blocks.length > 0 ? (
          <ul className="space-y-2">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p>{formatBlockRange(block.start_time, block.end_time)}</p>
                  <p className="text-muted-foreground">
                    {block.staff?.name ?? "All staff"}
                    {block.notes ? ` — ${block.notes}` : ""}
                  </p>
                </div>
                <IconButton
                  label="Remove time block"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(block.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming blocks.</p>
        )}

        <form action={formAction} className="space-y-3 border-t border-border pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="block_start">Start</Label>
              <Input id="block_start" name="start_time" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block_end">End</Label>
              <Input id="block_end" name="end_time" type="datetime-local" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="block_staff">Applies to</Label>
            <Select id="block_staff" name="staff_id" defaultValue="">
              <option value="">All staff</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="block_notes">Notes (optional)</Label>
            <Textarea id="block_notes" name="notes" rows={2} />
          </div>
          <AlertMessage error={state.error} success={state.success} />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Adding..." : "Add block"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
