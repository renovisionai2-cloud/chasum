"use client";

import { Button } from "@/components/ui/button";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addInternalNoteAction } from "@/lib/actions/communications";
import type { CommunicationRecord } from "@/lib/communication/types";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { format } from "date-fns";
import { useActionState } from "react";

export function InternalNotesPanel({
  customerId,
  notes,
  profileNotes,
}: {
  customerId: string;
  notes: CommunicationRecord[];
  profileNotes?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    addInternalNoteAction,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, undefined, () => refresh());

  return (
    <div className="space-y-4">
      {profileNotes ? (
        <div className="rounded-[var(--radius-md)] border border-border bg-muted/20 p-3">
          <p className="ds-label mb-1">Profile notes</p>
          <p className="text-sm text-muted-foreground">{profileNotes}</p>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No internal notes yet.</p>
      ) : (
        <ul className="divide-y divide-border/80">
          {notes.map((note) => (
            <li key={note.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm text-foreground">{note.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}
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
          <Label htmlFor="note_body">Add internal note</Label>
          <Textarea
            id="note_body"
            name="body"
            rows={3}
            required
            placeholder="Visible to your team only…"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="sync_profile" className="rounded border-border" />
          Also update profile notes
        </label>
        <AlertMessage error={state.error} success={state.success} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save note"}
        </Button>
      </form>
    </div>
  );
}
