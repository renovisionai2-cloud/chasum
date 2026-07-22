import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
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
    <div className={cn("space-y-2 animate-fade-in-up", className)}>
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
  pendingLabel = "Saving…",
  submitDisabled = false,
  className,
}: {
  onCancel?: () => void;
  pending: boolean;
  submitLabel: string;
  pendingLabel?: string;
  submitDisabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end",
        className,
      )}
      aria-busy={pending || undefined}
    >
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
      )}
      <Button type="submit" disabled={pending || submitDisabled}>
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4 border-primary-foreground/30 border-t-primary-foreground" />
            {pendingLabel}
          </span>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
