"use client";

import { resendReceiptFromWorkspaceAction } from "@/lib/actions/commerce-documents";
import { Button } from "@/components/ui/button";
import { AlertMessage } from "@/components/ui/form-feedback";
import type { CommerceActionState } from "@/lib/actions/commerce";
import Link from "next/link";
import { useState, useTransition } from "react";

export function ReceiptWorkspaceActions({
  receiptNumber,
  customerHref,
  appointmentHref,
  invoiceHref,
  refundHref,
}: {
  receiptNumber: string;
  customerHref: string;
  appointmentHref: string | null;
  invoiceHref: string | null;
  refundHref: string | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<CommerceActionState>({});

  return (
    <div className="print:hidden flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" onClick={() => window.print()}>
        Print
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          start(async () => {
            setMsg(await resendReceiptFromWorkspaceAction(receiptNumber));
          });
        }}
      >
        {pending ? "Sending…" : "Resend receipt"}
      </Button>
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
      {invoiceHref ? (
        <Link
          href={invoiceHref}
          className="inline-flex h-10 items-center px-3 text-sm font-medium underline-offset-4 hover:underline"
        >
          Open invoice
        </Link>
      ) : null}
      {refundHref ? (
        <Link
          href={refundHref}
          className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-border px-3.5 text-sm font-medium"
        >
          Refund from appointment
        </Link>
      ) : null}
      <AlertMessage error={msg.error} success={msg.success} />
    </div>
  );
}
