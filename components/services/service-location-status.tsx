"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { enableServiceAtLocation } from "@/lib/actions/services";
import { isServiceOfferedAtLocation, type OperatorServiceCatalogItem } from "@/lib/services/operator-catalog";
import { useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";

export function ServiceLocationStatus({ service, locationId }: {
  service: OperatorServiceCatalogItem;
  locationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const refresh = useRefresh();
  const { toast } = useToast();
  const offered = isServiceOfferedAtLocation(service, locationId);

  function enable() {
    startTransition(async () => {
      try {
        const result = await enableServiceAtLocation(service.id, locationId);
        if (result.error) toast(result.error, "error");
        else {
          toast(result.success ?? "Service enabled.", "success");
          refresh();
        }
      } catch {
        toast("Could not enable this service. Please try again.", "error");
      }
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
      <span className="text-sm text-muted-foreground">
        {offered ? "Offered here" : "Not offered here"}
      </span>
      {!offered && (
        <Button type="button" variant="outline" size="sm" disabled={pending}
          aria-label={`Enable ${service.name} at this location`} onClick={enable}>
          {pending ? "Enabling…" : "Enable at this location"}
        </Button>
      )}
    </div>
  );
}
