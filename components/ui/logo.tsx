import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm transition-transform duration-200 group-hover:scale-105">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-primary-foreground"
          aria-hidden="true"
        >
          <path
            d="M8 4v16M16 4v16M4 8h16M4 16h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
