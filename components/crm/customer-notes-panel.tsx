"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addCrmNoteAction,
  deleteCrmNoteAction,
} from "@/lib/actions/crm";
import type { CrmCustomerNote } from "@/lib/crm/types";
import type { ActionState } from "@/lib/types/booking";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { format } from "date-fns";
import { NotebookPen, Pin, Trash2 } from "lucide-react";
import { useActionState, useTransition } from "react";

export function CustomerNotesPanel({
  customerId,
  notes,
  profileNotes,
}: {
  customerId: string;
  notes: CrmCustomerNote[];
  profileNotes?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    addCrmNoteAction,
    {} as ActionState,
  );
  const refresh = useRefresh();
  const { toast } = useToast();
  const [deleting, startDelete] = useTransition();
  useFormAction(state, undefined, () => refresh());

  function remove(noteId: string) {
    startDelete(async () => {
      if (!(await confirmDelete("Delete this note?"))) return;
      const result = await deleteCrmNoteAction(noteId, customerId);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Note deleted.", "success");
        refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {profileNotes ? (
        <div className="rounded-[var(--radius-md)] border border-border bg-muted/20 p-3">
          <p className="ds-label mb-1">Profile notes</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {profileNotes}
          </p>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          variant="panel"
          glyph={NotebookPen}
          title="No CRM notes yet"
          description="Add internal, pinned, or private notes for your team."
        />
      ) : (
        <ul className="divide-y divide-border/80">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap gap-2">
                  {note.isPinned ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-spark">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  ) : null}
                  {note.isPrivate ? (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Private
                    </span>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive"
                disabled={deleting}
                onClick={() => remove(note.id)}
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
          <Label htmlFor="crm_note_body">Add note</Label>
          <Textarea id="crm_note_body" name="body" rows={3} required />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_pinned" />
            Pin note
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_private" />
            Private note
          </label>
        </div>
        <AlertMessage error={state.error} success={state.success} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save note"}
        </Button>
      </form>
    </div>
  );
}
