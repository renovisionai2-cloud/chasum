import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFormAction } from "@/hooks/use-form-action";
import type { ActionState } from "@/lib/types/booking";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

describe("useFormAction payment outcome truth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([null, "tx-recorded"])("keeps a created appointment's failed payment open (%s)", async (transactionId) => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const state: ActionState = {
      success:
        "Appointment confirmed — payment could not be recorded. Use Collect payment to retry.",
      appointmentId: "appt",
      payment: {
        status: "failed",
        amountCents: 5000,
        detail: "Synthetic failure",
        canRetry: true,
        transactionId,
      },
    };

    const { rerender } = renderHook(() => useFormAction(state, onSuccess, onClose));

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(state.success, "error"),
    );
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    rerender();
    expect(mocks.toast).toHaveBeenCalledTimes(1);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each(["recorded", "skipped"] as const)("closes a normal %s success once", async (status) => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const state: ActionState = {
      success: "Appointment confirmed — Deposit recorded — $50 by E-Transfer.",
      appointmentId: "appt",
      payment: {
        status,
        amountCents: 5000,
      },
    };

    renderHook(() => useFormAction(state, onSuccess, onClose));

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(state.success, "success"),
    );
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("preserves callbacks for callers without a created appointment", () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderHook(() => useFormAction({
      success: "Saved",
      payment: { status: "failed" },
    }, onSuccess, onClose));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
