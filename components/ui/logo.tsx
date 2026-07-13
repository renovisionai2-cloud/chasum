import { BrandBadge, ChasumMark } from "@/components/brand/marks";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

type LogoProps = {
  className?: string;
  showText?: boolean;
  href?: string | null;
  size?: "sm" | "md" | "lg";
  /** Wordmark weight for marketing hero contexts. */
  wordmarkClassName?: string;
};

export function Logo({
  className,
  showText = true,
  href = "/",
  size = "md",
  wordmarkClassName,
}: LogoProps) {
  const textSize =
    size === "lg" ? "text-xl" : size === "sm" ? "text-base" : "text-lg";

  const content = (
    <>
      <BrandBadge size={size} mark="c" />
      {showText && (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            textSize,
            wordmarkClassName,
          )}
        >
          {APP_NAME}
        </span>
      )}
    </>
  );

  if (href === null) {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className,
      )}
    >
      <span className="transition-transform duration-200 group-hover:scale-105">
        <BrandBadge size={size} mark="c" />
      </span>
      {showText && (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            textSize,
            wordmarkClassName,
          )}
        >
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}

/** Standalone C mark without frame — for watermarks and large brand moments. */
export function LogoMark({ className }: { className?: string }) {
  return <ChasumMark className={cn("text-primary", className)} />;
}
