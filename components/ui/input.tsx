import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 min-h-11 w-full rounded-[var(--radius-md)] border border-border bg-card px-4 text-sm text-foreground shadow-xs",
          "transition-[border-color,box-shadow,background-color] duration-200",
          "placeholder:text-muted-foreground",
          "hover:border-border/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus-visible:ring-destructive/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "touch-manipulation",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
