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
          className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success"
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
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      )}
      <button
        type="submit"
        disabled={pending || submitDisabled}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}
