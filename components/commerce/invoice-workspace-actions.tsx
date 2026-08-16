"use client";

import { sendInvoiceEmailAction } from "@/lib/actions/commerce-documents";
import { Button } from "@/components/ui/button";
import { AlertMessage } from "@/components/ui/form-feedback";
import type { CommerceActionState } from "@/lib/actions/commerce";
import Link from "next/link";
import { useState, useTransition } from "react";

export function InvoiceWorkspaceActions({
  invoiceNumber,
  customerHref,
  appointmentHref,
  collectHref,
  emailStatus,
  canEmail,
}: {
  invoiceNumber: string;
  customerHref: string;
  appointmentHref: string | null;
  collectHref: string | null;
  emailStatus: string;
  canEmail: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<CommerceActionState>({});

  return (
    <div className="print:hidden flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" onClick={() => window.print()}>
        Print
      </Button>
      {canEmail ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            start(async () => {
              setMsg(await sendInvoiceEmailAction(invoiceNumber));
            });
          }}
        >
          {pending ? "Sending…" : emailStatus === "sent" ? "Resend invoice" : "Email invoice"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">No customer email on file.</p>
      )}
      <Link
        href={customerHref}
        className="inline-flex h-10 items-center px-3 text-sm font-medium underline-offset-4 hover:underline"
      >
        Open customer
      </Link>
      {appointmentHref ? (
        <Link
          href={appointmentHref}
          className="inline-flex h-10 items-center px-3 text-sm font-medium underline-offset-4 hover:underline"
        >
          Open appointment
        </Link>
      ) : null}
      {collectHref ? (
        <Link
          href={collectHref}
          className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-border px-3.5 text-sm font-medium"
        >
          Collect payment
        </Link>
      ) : null}
      <AlertMessage error={msg.error} success={msg.success} />
    </div>
  );
}
