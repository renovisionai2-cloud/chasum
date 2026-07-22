import { cn } from "@/lib/utils";
import { forwardRef, type SelectHTMLAttributes } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 min-h-11 w-full rounded-[var(--radius-md)] border border-border bg-card px-4 text-sm text-foreground shadow-xs",
      "transition-[border-color,box-shadow,background-color] duration-200",
      "hover:border-border/90",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus-visible:ring-destructive/40",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "touch-manipulation",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";
