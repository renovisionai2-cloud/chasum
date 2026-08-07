"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * Desktop expand/collapse for Existing Appointment management workspace.
 * Hidden on small screens (full-screen sheet already).
 */
export function AppointmentExpandToggle({
  expanded,
  onToggle,
  className,
}: {
  expanded: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const label = expanded ? "Collapse appointment" : "Expand appointment";
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "hidden min-h-10 min-w-10 p-0 md:inline-flex",
        className,
      )}
      onClick={onToggle}
      aria-label={label}
      aria-expanded={expanded}
      title={label}
    >
      {expanded ? (
        <Minimize2 className="size-4" aria-hidden />
      ) : (
        <Maximize2 className="size-4" aria-hidden />
      )}
    </Button>
  );
}
