import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

type IconButtonProps = ButtonProps & {
  label: string;
};

export function IconButton({
  label,
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={label}
      title={label}
      className={cn("h-8 w-8 p-0", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
