import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Premium form field — label, control, optional hint, and inline error.
 * Use inside `.ds-form-stack` for consistent vertical rhythm.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const control = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(
      child as ReactElement<Record<string, unknown>>,
      {
        id: htmlFor,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      },
    );
  });

  return (
    <div className={cn("ds-field space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>
      <div
        className={cn(
          error &&
            "[&_input]:border-destructive/60 [&_select]:border-destructive/60 [&_textarea]:border-destructive/60",
        )}
      >
        {control}
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
