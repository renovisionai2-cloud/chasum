"use client";

import { formatMoneyCents } from "@/lib/commerce/money";
import type { ServicePackage } from "@/lib/business/types";
import type { Service } from "@/lib/types/booking";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type BookingServiceDecisionProps = {
  services: Service[];
  packages: ServicePackage[];
  locationId: string;
  serviceId: string;
  packageId: string;
  offerType: "service" | "package";
  currency?: string | null;
  onOfferTypeChange: (type: "service" | "package") => void;
  onPackageChange: (id: string) => void;
  onServiceChange: (id: string) => void;
};

export function BookingServiceDecision({
  services,
  packages,
  locationId,
  serviceId,
  packageId,
  offerType,
  currency,
  onOfferTypeChange,
  onPackageChange,
  onServiceChange,
}: BookingServiceDecisionProps) {
  const [query, setQuery] = useState("");
  const locationServices = services.filter(
    (s) => s.is_active && (!locationId || s.location_id === locationId),
  );
  const activePackages = packages.filter((p) => p.is_active);
  const q = query.trim().toLowerCase();

  const filteredServices = useMemo(() => {
    const list =
      offerType === "package" && packageId
        ? locationServices.filter((s) =>
            activePackages
              .find((p) => p.id === packageId)
              ?.service_ids.includes(s.id),
          )
        : locationServices;
    if (!q) return list;
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [locationServices, offerType, packageId, activePackages, q]);

  const filteredPackages = useMemo(() => {
    if (!q) return activePackages;
    return activePackages.filter((p) => p.name.toLowerCase().includes(q));
  }, [activePackages, q]);

  return (
    <div className="space-y-3">
      {activePackages.length > 0 ? (
        <div className="flex gap-2">
          {(
            [
              ["service", "Service"],
              ["package", "Package"],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              className={cn(
                "min-h-10 rounded-md border px-3 text-sm",
                offerType === type
                  ? "border-foreground/30 bg-muted/40 font-medium"
                  : "border-border text-muted-foreground",
              )}
              onClick={() => onOfferTypeChange(type)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <Input
        type="search"
        placeholder={
          offerType === "package" ? "Search packages…" : "Search services…"
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="min-h-11"
        aria-label="Search offerings"
      />

      {offerType === "package" ? (
        <ul className="max-h-[min(50vh,420px)] space-y-1.5 overflow-y-auto">
          {filteredPackages.map((p) => {
            const selected = p.id === packageId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full min-h-11 flex-col items-start rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-accent/30 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40",
                  )}
                  onClick={() => onPackageChange(p.id)}
                  aria-pressed={selected}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatMoneyCents(p.price_cents, currency)} · {p.total_visits}{" "}
                    visits
                  </span>
                </button>
              </li>
            );
          })}
          {filteredPackages.length === 0 ? (
            <li className="px-1 text-sm text-muted-foreground">No packages match.</li>
          ) : null}
        </ul>
      ) : (
        <ul className="max-h-[min(50vh,420px)] space-y-1.5 overflow-y-auto">
          {filteredServices.map((s) => {
            const selected = s.id === serviceId;
            const cents = Math.round(Number(s.price) * 100);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full min-h-11 flex-col items-start rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-accent/30 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40",
                  )}
                  onClick={() => onServiceChange(s.id)}
                  aria-pressed={selected}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.duration_minutes} min · {formatMoneyCents(cents, currency)}
                  </span>
                </button>
              </li>
            );
          })}
          {filteredServices.length === 0 ? (
            <li className="px-1 text-sm text-muted-foreground">No services match.</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
