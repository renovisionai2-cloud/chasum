"use client";

import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardInsight } from "@/lib/dashboard/insights";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function AiSuggestionsCard({
  insights,
}: {
  insights: DashboardInsight[];
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-spark-muted text-spark">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <h3 className="ds-section-title text-sm">AI Suggestions</h3>
      </div>
      {insights.length === 0 ? (
        <EmptyState
          variant="inline"
          icon="spark"
          title="No recommendations available."
          description="Suggestions appear only from real booking activity."
        />
      ) : (
        <ul className="space-y-2">
          {insights.map((insight) => (
            <li key={insight.id}>
              <Link
                href={insight.href}
                className="block rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2 text-xs transition-colors hover:border-primary/35 hover:bg-accent/30 ds-focus-ring"
              >
                <span className="font-medium text-muted-foreground">
                  {insight.employeeName}
                </span>
                <span className="mt-0.5 block text-foreground">
                  {insight.message}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
