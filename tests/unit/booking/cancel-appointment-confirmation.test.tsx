import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CancelAppointmentDialog } from "@/components/booking-sheet/cancel-appointment-dialog";
import { QuickActionsMenu } from "@/components/booking-sheet/quick-actions-menu";

afterEach(() => {
  cleanup();
});

const noop = () => undefined;

function menuHandlers(
  overrides: Partial<{
    onCancel: () => void;
    onCheckIn: () => void;
    onComplete: () => void;
    onReschedule: () => void;
    onDuplicate: () => void;
    onCollectPayment: () => void;
    onPrint: () => void;
    onMessage: () => void;
  }> = {},
) {
  return {
    onCheckIn: noop,
    onComplete: noop,
    onReschedule: noop,
    onDuplicate: noop,
    onCollectPayment: noop,
    onPrint: noop,
    onMessage: noop,
    onCancel: noop,
    ...overrides,
  };
}

function CancelFlowHarness({
  status,
  cancelAppointment,
}: {
  status: "confirmed" | "cancelled";
  cancelAppointment: (id: string) => Promise<{ success?: string; error?: string }>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const canCancel = status !== "cancelled";

  function closeConfirm() {
    if (busy || inFlight.current) return;
    setConfirmOpen(false);
  }

  function confirm() {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setBusy(true);
    void cancelAppointment("appt-1").finally(() => {
      inFlight.current = false;
      setBusy(false);
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <QuickActionsMenu
        isEditing
        canCancel={canCancel}
        {...menuHandlers({
          onCancel: () => {
            if (!canCancel) return;
            setConfirmOpen(true);
          },
        })}
      />
      <CancelAppointmentDialog
        open={confirmOpen}
        busy={busy}
        onKeep={closeConfirm}
        onConfirm={confirm}
      />
    </>
  );
}

describe("Booking Sheet cancellation confirmation", () => {
  it("does not call cancelAppointment when Cancel is clicked; the confirm dialog appears", async () => {
    const user = userEvent.setup();
    const cancelAppointment = vi.fn();
    render(
      <CancelFlowHarness
        status="confirmed"
        cancelAppointment={cancelAppointment}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Cancel" }));

    expect(
      screen.getByRole("dialog", { name: "Cancel appointment?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this will cancel the appointment and release the time/i),
    ).toBeInTheDocument();
    expect(cancelAppointment).not.toHaveBeenCalled();
  });

  it("Keep appointment closes the dialog with zero cancellation calls", async () => {
    const user = userEvent.setup();
    const cancelAppointment = vi.fn();
    render(
      <CancelFlowHarness
        status="confirmed"
        cancelAppointment={cancelAppointment}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Keep appointment" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cancelAppointment).not.toHaveBeenCalled();
  });

  it("Escape and backdrop close without cancelling", async () => {
    const user = userEvent.setup();
    const cancelAppointment = vi.fn();
    const { container } = render(
      <CancelFlowHarness
        status="confirmed"
        cancelAppointment={cancelAppointment}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Cancel" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cancelAppointment).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Cancel" }));
    const backdrop = container.querySelector(".bg-black\\/50");
    expect(backdrop).toBeTruthy();
    await user.click(backdrop as Element);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cancelAppointment).not.toHaveBeenCalled();
  });

  it("destructive confirm calls cancellation exactly once", async () => {
    const user = userEvent.setup();
    const cancelAppointment = vi.fn().mockResolvedValue({ success: "ok" });
    render(
      <CancelFlowHarness
        status="confirmed"
        cancelAppointment={cancelAppointment}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Cancel" }));
    const confirm = screen.getByRole("button", { name: "Cancel appointment" });
    expect(confirm.className).toContain("bg-destructive");
    await user.click(confirm);

    expect(cancelAppointment).toHaveBeenCalledTimes(1);
    expect(cancelAppointment).toHaveBeenCalledWith("appt-1");
  });

  it("does not offer Cancel when the appointment is already cancelled", async () => {
    const user = userEvent.setup();
    render(
      <CancelFlowHarness
        status="cancelled"
        cancelAppointment={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.queryByRole("menuitem", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Reschedule" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toBeInTheDocument();
  });

  it("repeated confirm interaction cannot produce a duplicate cancellation call", async () => {
    const user = userEvent.setup();
    let resolveCancel: ((value: { success: string }) => void) | undefined;
    const cancelAppointment = vi.fn(
      () =>
        new Promise<{ success: string }>((resolve) => {
          resolveCancel = resolve;
        }),
    );
    render(
      <CancelFlowHarness
        status="confirmed"
        cancelAppointment={cancelAppointment}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Cancel" }));
    const confirm = screen.getByRole("button", { name: "Cancel appointment" });
    confirm.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    confirm.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(cancelAppointment).toHaveBeenCalledTimes(1);

    resolveCancel?.({ success: "ok" });
  });
});
