"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addCustomerDocument,
  deleteCustomerDocument,
} from "@/lib/actions/customer-documents";
import type { ActionState, CustomerDocument } from "@/lib/types/booking";
import { AlertMessage } from "@/components/ui/form-feedback";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { confirmDelete } from "@/hooks/use-form-action";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useActionState } from "react";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "waiver", label: "Waiver" },
  { value: "consent", label: "Consent form" },
  { value: "intake", label: "Intake" },
  { value: "photo", label: "Photo" },
  { value: "id", label: "ID" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
] as const;

export function CustomerDocumentsPanel({
  customerId,
  documents,
}: {
  customerId: string;
  documents: CustomerDocument[];
}) {
  const [state, formAction, pending] = useActionState(
    addCustomerDocument,
    {} as ActionState,
  );
  const refresh = useRefresh();
  const { toast } = useToast();

  useFormAction(state, undefined, () => refresh());

  async function handleDelete(id: string, name: string) {
    if (!(await confirmDelete(`Remove ${name}?`))) return;
    const result = await deleteCustomerDocument(id, customerId);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Document removed.", "success");
      refresh();
    }
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 first:pt-2 last:pb-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {doc.name}
                  </span>
                  {doc.category ? (
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {doc.category}
                      {doc.signature_status
                        ? ` · ${doc.signature_status}`
                        : ""}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <input type="hidden" name="customer_id" value={customerId} />
        <input type="hidden" name="folder" value="client-documents" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="doc_name">Document name</Label>
            <Input
              id="doc_name"
              name="name"
              placeholder="Consent form, waiver…"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc_category">Category</Label>
            <Select id="doc_category" name="category" defaultValue="general">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc_file">File</Label>
          <Input
            id="doc_file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Waivers, consents, and photos. Signature capture ships in a later phase.
        </p>
        <AlertMessage error={state.error} success={state.success} />
        <Button type="submit" disabled={pending}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          {pending ? "Uploading…" : "Upload document"}
        </Button>
      </form>
    </div>
  );
}
