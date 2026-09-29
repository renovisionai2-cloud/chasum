"use client";

import { Sheet } from "@/components/ui/sheet";
import { setLocationScope } from "@/lib/actions/location";
import { ALL_LOCATIONS, type LocationScope } from "@/lib/location/constants";
import type { Location } from "@/lib/types/booking";
import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

type Props = { locations: Location[]; scope: LocationScope };

/** Workspace view only. The server's canonical scope remains the selected value. */
export function MobileWorkspaceScope({ locations, scope }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const trigger = useRef<HTMLButtonElement>(null);
  const active = locations.filter((location) => location.is_active);
  const value = scope.mode === "all" ? ALL_LOCATIONS : scope.locationId;
  const label = active.length === 1
    ? active[0].name
    : value === ALL_LOCATIONS
      ? "All locations"
      : active.find((location) => location.id === value)?.name ?? "Choose location";

  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(min-width: 640px)");
    const onResize = () => { if (media.matches) close(); };
    media.addEventListener("change", onResize);
    return () => media.removeEventListener("change", onResize);
  }, [open, close]);

  function select(next: string) {
    if (pending) return;
    if (next === value) { close(); return; }
    setError(null);
    startTransition(async () => {
      try {
        await setLocationScope(next);
        router.refresh();
        close();
      } catch {
        setError("Could not change workspace. Please try again.");
      }
    });
  }

  if (active.length === 0) return null;

  return (
    <div className="min-w-0 flex-1 sm:hidden">
      {active.length === 1 ? (
        <div className="min-w-0 px-1" aria-label={`Workspace location: ${label}`} title={label}>
          <span className="block text-[10px] leading-3 text-muted-foreground">Viewing</span>
          <span className="block truncate text-xs font-semibold">{label}</span>
        </div>
      ) : (
        <button
          ref={trigger}
          type="button"
          className="ds-focus-ring flex min-h-11 w-full min-w-0 items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 text-left touch-manipulation"
          aria-label={`Workspace location: ${label}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-disabled={pending}
          title={label}
          onClick={() => { if (!pending) { setError(null); setOpen(true); } }}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] leading-3 text-muted-foreground">Viewing</span>
            <span className="block truncate text-xs font-semibold">{label}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      )}
      {/* Escape the header's backdrop-filter containing block and stacking context. */}
      {open && createPortal(
        <Sheet open={open} onClose={close} title="Workspace location" description="Choose which location you’re viewing.">
          <div className="space-y-2" aria-busy={pending}>
            {[{ id: ALL_LOCATIONS, name: "All locations" }, ...active].map((location) => (
              <button
                key={location.id}
                type="button"
                aria-pressed={value === location.id}
                aria-disabled={pending}
                onClick={() => select(location.id)}
                className="ds-focus-ring flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm aria-pressed:border-primary aria-pressed:bg-primary/10 aria-disabled:opacity-60"
              >
                <span className="min-w-0 break-words">{location.name}</span>
                {value === location.id && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            ))}
            {pending && <p role="status" className="text-sm text-muted-foreground">Switching workspace…</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
        </Sheet>, document.body,
      )}
    </div>
  );
}
