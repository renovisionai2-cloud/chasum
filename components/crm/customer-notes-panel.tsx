"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addCrmNoteAction,
  deleteCrmNoteAction,
} from "@/lib/actions/crm";
import {
  CRM_NOTE_TYPE_LABELS,
  type CrmCustomerNote,
  type CrmNoteType,
} from "@/lib/crm/types";
import type { ActionState } from "@/lib/types/booking";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { format } from "date-fns";
import { AlertTriangle, NotebookPen, Pin, Search, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState, useTransition } from "react";

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
  const [search, setSearch] = useState("");
  const refresh = useRefresh();
  const { toast } = useToast();
  const [deleting, startDelete] = useTransition();
  useFormAction(state, undefined, () => refresh());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...notes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (!q) return sorted;
    return sorted.filter((note) => {
      const hay = [
        note.body,
        note.noteType,
        note.createdBy ?? "",
        CRM_NOTE_TYPE_LABELS[note.noteType as CrmNoteType] ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [notes, search]);

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

      {notes.length > 0 ? (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes"
            className="pl-9"
            aria-label="Search notes"
          />
        </div>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          variant="panel"
          glyph={NotebookPen}
          title="No CRM notes yet"
          description="Add pinned, private, warning, or medical notes for your team."
        />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          No notes match “{search.trim()}”.
        </p>
      ) : (
        <ul className="divide-y divide-border/80">
          {filtered.map((note) => (
            <li key={note.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap gap-2">
                  {note.noteType === "warning" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3" /> Warning
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {CRM_NOTE_TYPE_LABELS[note.noteType as CrmNoteType] ??
                        "General"}
                    </span>
                  )}
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
                  {note.createdBy ? ` · ${note.createdBy}` : ""}
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="note_type">Note type</Label>
            <Select id="note_type" name="note_type" defaultValue="general">
              {Object.entries(CRM_NOTE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-end gap-4 pb-1 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_pinned" />
              Pin note
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_private" />
              Private note
            </label>
          </div>
        </div>
        <AlertMessage error={state.error} success={state.success} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save note"}
        </Button>
      </form>
    </div>
  );
}
