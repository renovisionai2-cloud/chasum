"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addStaffDocument,
  deleteStaffDocument,
} from "@/lib/actions/staff-documents";
import type { ActionState, StaffDocument } from "@/lib/types/booking";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useActionState } from "react";

export function EmployeeDocumentsPanel({
  staffId,
  documents,
}: {
  staffId: string;
  documents: StaffDocument[];
}) {
  const [state, formAction, pending] = useActionState(
    addStaffDocument,
    {} as ActionState,
  );
  const refresh = useRefresh();
  const { toast } = useToast();
  useFormAction(state, undefined, () => refresh());

  async function handleDelete(id: string, name: string) {
    if (!(await confirmDelete(`Remove ${name}?`))) return;
    const result = await deleteStaffDocument(id, staffId);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Document removed.", "success");
      refresh();
    }
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <EmptyState
          variant="panel"
          glyph={FileText}
          title="No documents yet"
          description="Upload contracts, certifications, tax forms, and training files."
        />
      ) : (
        <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {doc.category ?? "general"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                  aria-label={`Open ${doc.name}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => void handleDelete(doc.id, doc.name)}
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={formAction}
        className="space-y-3 rounded-[var(--radius-md)] border border-dashed border-border p-4"
      >
        <input type="hidden" name="staff_id" value={staffId} />
        <input type="hidden" name="folder" value="staff-documents" />
        <div className="space-y-2">
          <Label htmlFor="staff_doc_name">Document name</Label>
          <Input id="staff_doc_name" name="name" required placeholder="W-4, license…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff_doc_category">Category</Label>
          <Select id="staff_doc_category" name="category" defaultValue="general">
            <option value="general">General</option>
            <option value="contract">Contract / employment</option>
            <option value="certification">Certification</option>
            <option value="license">License</option>
            <option value="id">ID</option>
            <option value="tax">Tax</option>
            <option value="training">Training</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staff_doc_expires">Expires on</Label>
            <Input id="staff_doc_expires" name="expires_on" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff_doc_issued_by">Issued by</Label>
            <Input id="staff_doc_issued_by" name="issued_by" placeholder="Optional" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff_doc_file">File</Label>
          <Input
            id="staff_doc_file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
          />
        </div>
        <AlertMessage error={state.error} success={state.success} />
        <Button type="submit" size="sm" disabled={pending}>
          <Upload className="h-4 w-4" />
          {pending ? "Uploading…" : "Upload document"}
        </Button>
      </form>
    </div>
  );
}
