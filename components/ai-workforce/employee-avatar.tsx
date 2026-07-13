import { SparkMark } from "@/components/brand/marks";
import { cn } from "@/lib/utils";
import type { AiEmployee } from "@/lib/ai-workforce/types";

const accentStyles = {
  primary: "bg-accent text-primary",
  spark: "bg-spark-muted text-spark",
  success: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
} as const;

type AiEmployeeAvatarProps = {
  employee: Pick<AiEmployee, "name" | "accent">;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeStyles = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
} as const;

export function AiEmployeeAvatar({
  employee,
  size = "md",
  className,
}: AiEmployeeAvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-2xl font-semibold",
        accentStyles[employee.accent],
        sizeStyles[size],
        className,
      )}
      aria-hidden="true"
    >
      {employee.name.charAt(0)}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-spark text-spark-foreground shadow-sm">
        <SparkMark className="h-2.5 w-2.5" />
      </span>
    </span>
  );
}
