"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useToast } from "@/providers/toast-provider";
import type { ActionState } from "@/lib/types/booking";

export function useRefresh() {
  const router = useRouter();
  return useCallback(() => router.refresh(), [router]);
}

/**
 * Toasts once per distinct success/error message and refreshes.
 * Callbacks are held in refs so unstable inline lambdas do not re-fire toasts.
 */
export function useFormAction(
  state: ActionState,
  onSuccess?: () => void,
  onClose?: () => void,
) {
  const { toast } = useToast();
  const refresh = useRefresh();
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);
  const lastErrorRef = useRef<string | null>(null);
  const lastSuccessRef = useRef<string | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [onSuccess, onClose]);

  useEffect(() => {
    if (state.error) {
      if (lastErrorRef.current !== state.error) {
        lastErrorRef.current = state.error;
        toast(state.error, "error");
      }
      return;
    }
    lastErrorRef.current = null;

    if (state.success) {
      if (lastSuccessRef.current !== state.success) {
        lastSuccessRef.current = state.success;
        toast(state.success, "success");
        refresh();
        onSuccessRef.current?.();
        onCloseRef.current?.();
      }
      return;
    }
    lastSuccessRef.current = null;
  }, [state.error, state.success, toast, refresh]);
}

export async function confirmDelete(message: string): Promise<boolean> {
  return window.confirm(message);
}
