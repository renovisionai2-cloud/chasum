"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  sendCustomerEmailAction,
  sendCustomerSmsAction,
} from "@/lib/actions/communications";
import {
  SMS_PLAN_UPGRADE_CTA,
  SMS_PLAN_UPGRADE_HREF,
  SMS_PLAN_UPGRADE_MESSAGE,
} from "@/lib/billing/plan-features";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction } from "@/hooks/use-form-action";
import Link from "next/link";
import { useActionState } from "react";

type ComposeMode = "sms" | "email";

type ComposeMessageDialogProps = {
  open: boolean;
  mode: ComposeMode;
  onClose: () => void;
  customerId: string;
  appointmentId?: string | null;
  recipient: string;
  customerName: string;
  /** When false, SMS submit is blocked with upgrade messaging. */
  smsAllowed?: boolean;
  smsBlockedReason?: string | null;
};

export function ComposeMessageDialog({
  open,
  mode,
  onClose,
  customerId,
  appointmentId,
  recipient,
  customerName,
  smsAllowed = true,
  smsBlockedReason = null,
}: ComposeMessageDialogProps) {
  const action = mode === "sms" ? sendCustomerSmsAction : sendCustomerEmailAction;
  const [state, formAction, pending] = useActionState(
    action,
    {} as ActionState & { deepLink?: string },
  );

  const smsBlocked = mode === "sms" && !smsAllowed;

  useFormAction(state, undefined, () => {
    if (state.success) onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "sms" ? "Text Customer" : "Email Customer"}
      description={`Message ${customerName}`}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="customer_id" value={customerId} />
        <input type="hidden" name="appointment_id" value={appointmentId ?? ""} />
        {mode === "sms" ? (
          <input type="hidden" name="phone" value={recipient} />
        ) : (
          <input type="hidden" name="email" value={recipient} />
        )}

        {smsBlocked ? (
          <div
            className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm"
            role="status"
          >
            <p className="font-medium text-foreground">
              SMS requires Professional
            </p>
            <p className="mt-1 text-muted-foreground">
              {smsBlockedReason ?? SMS_PLAN_UPGRADE_MESSAGE}
            </p>
            <Link
              href={SMS_PLAN_UPGRADE_HREF}
              className="mt-2 inline-flex text-sm font-medium underline underline-offset-2"
              onClick={onClose}
            >
              {SMS_PLAN_UPGRADE_CTA}
            </Link>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>{mode === "sms" ? "To phone" : "To email"}</Label>
          <Input value={recipient} readOnly disabled />
        </div>

        {mode === "email" ? (
          <div className="space-y-2">
            <Label htmlFor="comm_subject">Subject</Label>
            <Input
              id="comm_subject"
              name="subject"
              placeholder="Subject"
              defaultValue="Message from your provider"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="comm_body">Message</Label>
          <Textarea
            id="comm_body"
            name="body"
            rows={5}
            required={!smsBlocked}
            disabled={smsBlocked}
            placeholder={
              mode === "sms"
                ? "Write a text message…"
                : "Write an email message…"
            }
          />
        </div>

        <AlertMessage error={state.error} success={state.success} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || smsBlocked}>
            {smsBlocked
              ? "SMS unavailable"
              : pending
                ? "Sending…"
                : mode === "sms"
                  ? "Send text"
                  : "Send email"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
