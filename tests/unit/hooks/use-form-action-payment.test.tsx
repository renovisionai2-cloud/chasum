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

  it("styles an appointment partial-success payment failure as an error", async () => {
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
      },
    };

    renderHook(() => useFormAction(state, onSuccess, onClose));

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(state.success, "error"),
    );
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps normal successful outcomes styled as success", async () => {
    const state: ActionState = {
      success: "Appointment confirmed — Deposit recorded — $50 by E-Transfer.",
      appointmentId: "appt",
      payment: {
        status: "recorded",
        amountCents: 5000,
      },
    };

    renderHook(() => useFormAction(state));

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(state.success, "success"),
    );
  });
});
