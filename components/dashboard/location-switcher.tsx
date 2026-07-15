"use client";

import { AddLocationDialog } from "@/components/dashboard/add-location-dialog";
import { UpgradeToProfessionalModal } from "@/components/marketing/upgrade-to-professional-modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ALL_LOCATIONS } from "@/lib/location/constants";
import { setLocationScope } from "@/lib/actions/location";
import type { LocationScope } from "@/lib/location/constants";
import { FREE_PLAN_UPGRADE_CTA } from "@/lib/marketing/pricing";
import type { Location, SubscriptionPlan } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LocationSwitcherProps = {
  locations: Location[];
  scope: LocationScope;
  quota: {
    plan: SubscriptionPlan | null;
    currentCount: number;
    canAdd: boolean;
  };
  className?: string;
};

function currentValue(scope: LocationScope): string {
  return scope.mode === "all" ? ALL_LOCATIONS : scope.locationId;
}

export function LocationSwitcher({
  locations,
  scope,
  quota,
  className,
}: LocationSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function handleChange(value: string) {
    startTransition(async () => {
      await setLocationScope(value);
      router.refresh();
    });
  }

  if (locations.length <= 1 && !quota.canAdd) {
    const only = locations[0];
    if (!only) return null;
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{only.name}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 px-2.5 text-xs"
          onClick={() => setUpgradeOpen(true)}
        >
          {FREE_PLAN_UPGRADE_CTA}
        </Button>
        <UpgradeToProfessionalModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex min-w-0 items-center">
        <MapPin className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
        <Select
          value={currentValue(scope)}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value)}
          className="h-9 max-w-[220px] pl-8 pr-8 text-sm"
          aria-label="Switch location"
        >
          {locations.length > 1 && (
            <option value={ALL_LOCATIONS}>All locations</option>
          )}
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
              {location.is_default ? " (default)" : ""}
            </option>
          ))}
        </Select>
      </div>
      {quota.canAdd ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 px-2.5"
          onClick={() => setAddOpen(true)}
          aria-label="Add location"
        >
          <Plus className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 px-2.5 text-xs"
          onClick={() => setUpgradeOpen(true)}
        >
          {FREE_PLAN_UPGRADE_CTA}
        </Button>
      )}
      <AddLocationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultTimezone={locations[0]?.timezone ?? undefined}
      />
      <UpgradeToProfessionalModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
}
