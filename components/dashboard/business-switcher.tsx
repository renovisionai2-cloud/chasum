"use client";

import { Select } from "@/components/ui/select";
import { setActiveBusinessAction } from "@/lib/actions/tenancy";
import { cn } from "@/lib/utils";
import { Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type BusinessSwitcherItem = {
  id: string;
  name: string;
};

type BusinessSwitcherProps = {
  businesses: BusinessSwitcherItem[];
  activeBusinessId: string;
  className?: string;
};

/**
 * Shown only when the signed-in user can operate more than one tenant.
 * Selection is authorized on the server; this control never invents tenants.
 */
export function BusinessSwitcher({
  businesses,
  activeBusinessId,
  className,
}: BusinessSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (businesses.length <= 1) return null;

  const current =
    businesses.find((row) => row.id === activeBusinessId) ?? businesses[0];

  function handleChange(value: string) {
    if (!value || value === activeBusinessId) return;
    setError(null);
    startTransition(async () => {
      const result = await setActiveBusinessAction(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="relative flex min-w-0 items-center">
        <Briefcase
          className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <Select
          value={current?.id ?? ""}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value)}
          className="h-9 max-w-[220px] pl-8 pr-8 text-sm"
          aria-label="Switch business"
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </Select>
      </div>
      {error ? (
        <p className="mt-1 max-w-[220px] text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
