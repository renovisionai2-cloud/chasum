"use client";

import { ComposeMessageDialog } from "@/components/communication/compose-message-dialog";
import { Button } from "@/components/ui/button";
import { logQuickCallAction } from "@/lib/actions/communications";
import { useToast } from "@/providers/toast-provider";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { useState, useTransition } from "react";

type QuickCommActionsProps = {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  appointmentId?: string | null;
};

/**
 * Compact Call / Text / Email controls for appointment dialogs.
 * Does not touch booking submit / slot logic.
 */
export function QuickCommActions({
  customer,
  appointmentId,
}: QuickCommActionsProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [compose, setCompose] = useState<"sms" | "email" | null>(null);

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
    <>
      <div className="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-border bg-muted/20 p-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          disabled={pending || !customer.phone}
          onClick={handleCall}
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          Quick Call
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          disabled={!customer.phone}
          onClick={() => setCompose("sms")}
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          Quick Text
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          disabled={!customer.email}
          onClick={() => setCompose("email")}
        >
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          Quick Email
        </Button>
      </div>

      {compose === "sms" && customer.phone ? (
        <ComposeMessageDialog
          open
          mode="sms"
          onClose={() => setCompose(null)}
          customerId={customer.id}
          appointmentId={appointmentId}
          recipient={customer.phone}
          customerName={customer.name}
        />
      ) : null}
      {compose === "email" ? (
        <ComposeMessageDialog
          open
          mode="email"
          onClose={() => setCompose(null)}
          customerId={customer.id}
          appointmentId={appointmentId}
          recipient={customer.email}
          customerName={customer.name}
        />
      ) : null}
    </>
  );
}
