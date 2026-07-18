import Link from "next/link";
import type { ReactNode } from "react";

/** Shared chrome for marketing subpages (roadmap, legal, apply, etc.). */
export function MarketingDocPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-6 pb-24 pt-16 md:pb-32 md:pt-20">
      <div className="mx-auto max-w-3xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-foreground md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className="mt-12 space-y-8 text-base leading-relaxed text-foreground/90">
          {children}
        </div>
        <p className="mt-16 text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
