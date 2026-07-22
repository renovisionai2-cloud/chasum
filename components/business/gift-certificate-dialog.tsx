"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emailGiftCertificateAction,
  loadGiftCertificate,
} from "@/lib/actions/business-management";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction } from "@/hooks/use-form-action";
import { useActionState, useEffect, useState, useTransition } from "react";

type CertPack = NonNullable<Awaited<ReturnType<typeof loadGiftCertificate>>>;

export function GiftCertificateDialog({
  giftCardId,
  open,
  onClose,
  defaultEmail = "",
}: {
  giftCardId: string | null;
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
}) {
  const [pack, setPack] = useState<CertPack | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [emailState, emailAction, emailPending] = useActionState(
    emailGiftCertificateAction,
    {} as ActionState,
  );

  useFormAction(emailState);

  useEffect(() => {
    if (!open || !giftCardId) return;
    let cancelled = false;
    startLoad(async () => {
      const result = await loadGiftCertificate(giftCardId);
      if (cancelled) return;
      if (!result) {
        setLoadError("Could not load gift certificate.");
        setPack(null);
        return;
      }
      setLoadError(null);
      setPack(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open, giftCardId]);

  const visiblePack = open && giftCardId ? pack : null;

  function downloadHtml() {
    if (!visiblePack) return;
    const blob = new Blob([visiblePack.html], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gift-certificate-${visiblePack.card.code}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printCertificate() {
    if (!visiblePack) return;
    const w = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=720,height=900",
    );
    if (!w) return;
    w.document.write(visiblePack.html);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Gift certificate"
      description="Preview, print, download, or email a professional certificate."
      className="sm:max-w-2xl"
    >
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading certificate…</p>
        ) : null}
        {loadError && open ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : null}

        {visiblePack ? (
          <>
            <div className="max-h-[50vh] overflow-auto rounded-[var(--radius-md)] border border-border bg-muted/20 p-2">
              <iframe
                title="Gift certificate preview"
                srcDoc={visiblePack.html}
                className="h-[420px] w-full rounded-[var(--radius-sm)] bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={printCertificate}>
                Print / Save as PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={downloadHtml}
              >
                Download
              </Button>
            </div>

            <form
              action={emailAction}
              className="space-y-3 border-t border-border pt-4"
            >
              <input type="hidden" name="gift_card_id" value={visiblePack.card.id} />
              <p className="text-sm font-medium">Email to customer</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gc_recipient_name">Recipient</Label>
                  <Input
                    id="gc_recipient_name"
                    name="recipient_name"
                    placeholder="Who receives this"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gc_sender_name">From</Label>
                  <Input
                    id="gc_sender_name"
                    name="sender_name"
                    placeholder="Sender name"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="gc_email">Email</Label>
                  <Input
                    id="gc_email"
                    name="email"
                    type="email"
                    required
                    defaultValue={defaultEmail}
                    placeholder="customer@email.com"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="gc_personal_message">Personal message</Label>
                  <Input
                    id="gc_personal_message"
                    name="personal_message"
                    placeholder="Optional note on the certificate"
                  />
                </div>
              </div>
              <AlertMessage
                error={emailState.error}
                success={emailState.success}
              />
              <Button type="submit" size="sm" disabled={emailPending}>
                {emailPending ? "Sending…" : "Email to customer"}
              </Button>
            </form>
          </>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
