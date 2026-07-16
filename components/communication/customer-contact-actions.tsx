"use client";

import { Button } from "@/components/ui/button";
import { logQuickCallAction } from "@/lib/actions/communications";
import { mapsUrlForAddress } from "@/lib/communication/channels";
import { useToast } from "@/providers/toast-provider";
import {
  Copy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";
import { useTransition } from "react";

export type ContactTarget = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
};

type CustomerContactActionsProps = {
  customer: ContactTarget;
  appointmentId?: string | null;
  /** Optional map fallback when customer has no address. */
  mapsAddress?: string | null;
  onComposeSms?: () => void;
  onComposeEmail?: () => void;
  compact?: boolean;
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function CustomerContactActions({
  customer,
  appointmentId,
  mapsAddress,
  onComposeSms,
  onComposeEmail,
  compact = false,
}: CustomerContactActionsProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const address = (customer.address ?? mapsAddress ?? "").trim();
  const size = compact ? "sm" : "sm";
  const btnClass = compact ? "h-8 px-2 text-xs" : undefined;

  function handleCall() {
    if (!customer.phone) {
      toast("No phone number on file.", "error");
      return;
    }
    startTransition(async () => {
      const result = await logQuickCallAction({
        customerId: customer.id,
        appointmentId,
        phone: customer.phone!,
      });
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      if (result.deepLink) window.open(result.deepLink, "_self");
      toast(result.success ?? "Call started.", "success");
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size={size}
        className={btnClass}
        disabled={pending || !customer.phone}
        onClick={handleCall}
      >
        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
        Call Customer
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        className={btnClass}
        disabled={!customer.phone}
        onClick={() => onComposeSms?.()}
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
        Text Customer
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        className={btnClass}
        disabled={!customer.email}
        onClick={() => onComposeEmail?.()}
      >
        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
        Email Customer
      </Button>
      {customer.phone ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          className={btnClass}
          onClick={() => {
            void copyText(customer.phone!).then(() =>
              toast("Phone copied.", "success"),
            );
          }}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copy phone
        </Button>
      ) : null}
      {customer.email ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          className={btnClass}
          onClick={() => {
            void copyText(customer.email).then(() =>
              toast("Email copied.", "success"),
            );
          }}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copy email
        </Button>
      ) : null}
      {address ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          className={btnClass}
          onClick={() => {
            window.open(mapsUrlForAddress(address), "_blank", "noopener,noreferrer");
          }}
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          Open Maps
        </Button>
      ) : null}
    </div>
  );
}
