import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AlertMessage({
  error,
  success,
  className,
}: {
  error?: string;
  success?: string;
  className?: string;
}) {
  if (!error && !success) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-[var(--radius-md)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {success}
        </p>
      )}
    </div>
  );
}

export function FormFooter({
  onCancel,
  pending,
  submitLabel,
  pendingLabel = "Saving...",
  submitDisabled = false,
}: {
  onCancel?: () => void;
  pending: boolean;
  submitLabel: string;
  pendingLabel?: string;
  submitDisabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
      <Button type="submit" disabled={pending || submitDisabled}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}
