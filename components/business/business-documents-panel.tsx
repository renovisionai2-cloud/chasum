"use client";

import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addBusinessDocument,
  deleteBusinessDocument,
} from "@/lib/actions/business-management";
import type { BusinessDocument } from "@/lib/business/settings";
import type { ActionState } from "@/lib/types/booking";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { ExternalLink, FileText } from "lucide-react";
import { useActionState, useTransition } from "react";

export function BusinessDocumentsPanel({
  documents,
}: {
  documents: BusinessDocument[];
}) {
  const [state, action, pending] = useActionState(
    addBusinessDocument,
    {} as ActionState,
  );
  const refresh = useRefresh();
  const { toast } = useToast();
  const [deleting, startDelete] = useTransition();
  useFormAction(state, undefined, () => refresh());

  function remove(id: string, name: string) {
    startDelete(async () => {
      if (!(await confirmDelete(`Remove “${name}”?`))) return;
      const result = await deleteBusinessDocument(id);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Removed.", "success");
        refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.length === 0 ? (
          <EmptyState
            variant="panel"
            title="No documents yet"
            description="Upload licenses, insurance, and other business files to Supabase Storage."
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
                  <span className="truncate text-sm font-medium">{doc.name}</span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-muted"
                    aria-label={`Open ${doc.name}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={deleting}
                    onClick={() => remove(doc.id, doc.name)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={action} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="doc_name">Document name</Label>
            <Input id="doc_name" name="name" required placeholder="Business license" />
          </div>
          <ImageUploadField
            id="file_url"
            name="file_url"
            label="File (PDF or image)"
            folder="documents"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            hint="Upload JPG, PNG, WebP, GIF, or PDF up to 5 MB."
          />
          <input type="hidden" name="file_type" value="document" />
          <AlertMessage error={state.error} success={state.success} />
          <FormFooter pending={pending} submitLabel="Upload document" />
        </form>
      </CardContent>
    </Card>
  );
}
