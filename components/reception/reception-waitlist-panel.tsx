"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { removeFromWaitlist } from "@/lib/actions/notifications";
import { useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { ListOrdered } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

type WaitlistEntry = {
  id: string;
  status: string;
  preferred_date: string;
  notes: string | null;
  priority?: number;
  customer?: { name?: string; email?: string } | null;
  service?: { name?: string } | null;
  staff?: { name?: string } | null;
};

export function ReceptionWaitlistPanel({
  entries,
}: {
  entries: WaitlistEntry[];
}) {
  const waiting = entries.filter(
    (e) => e.status === "waiting" || e.status === "notified",
  );
  const refresh = useRefresh();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="ds-section-title text-sm">Waitlist</h3>
        <Link href="/dashboard/automation">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
            Manage
          </Button>
        </Link>
      </div>
      {waiting.length === 0 ? (
        <EmptyState
          variant="inline"
          glyph={ListOrdered}
          icon="none"
          title="Waitlist is clear"
          description="Priority and cancellation-queue fills appear here."
        />
      ) : (
        <ul className="space-y-2">
          {waiting
            .slice()
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
            .slice(0, 6)
            .map((entry) => (
              <li
                key={entry.id}
                className="rounded-[var(--radius-md)] border border-border px-3 py-2"
              >
                <p className="truncate text-sm font-medium">
                  {entry.customer?.name ?? "Customer"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {entry.service?.name ?? "Service"} · {entry.preferred_date}
                  {entry.status === "notified" ? " · Notified" : ""}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1 h-7 px-2 text-xs"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await removeFromWaitlist(entry.id);
                      if (result.error) toast(result.error, "error");
                      else {
                        toast(result.success ?? "Removed.", "success");
                        refresh();
                      }
                    });
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
