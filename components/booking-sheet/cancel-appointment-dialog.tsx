"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type CancelAppointmentDialogProps = {
  open: boolean;
  busy?: boolean;
  onKeep: () => void;
  onConfirm: () => void;
};

export function CancelAppointmentDialog({
  open,
  busy = false,
  onKeep,
  onConfirm,
}: CancelAppointmentDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onKeep}
      title="Cancel appointment?"
      description="This will cancel the appointment and release the time. Cancellation communications may be queued according to business settings."
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onKeep}
          disabled={busy}
        >
          Keep appointment
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Cancelling…" : "Cancel appointment"}
        </Button>
      </div>
    </Dialog>
  );
}
