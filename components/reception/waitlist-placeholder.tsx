"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { ListOrdered } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Placeholder until waitlist is docked into reception (engine already exists). */
export function WaitlistPlaceholder() {
  return (
    <section className="space-y-2">
      <h3 className="ds-section-title text-sm">Waitlist</h3>
      <EmptyState
        variant="inline"
        glyph={ListOrdered}
        icon="none"
        title="Waitlist coming to reception"
        description="Manage waitlist entries under Automation for now."
      >
        <Link href="/dashboard/automation">
          <Button size="sm" variant="outline">
            Open automation
          </Button>
        </Link>
      </EmptyState>
    </section>
  );
}
