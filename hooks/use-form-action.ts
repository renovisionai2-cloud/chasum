"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useToast } from "@/providers/toast-provider";
import type { ActionState } from "@/lib/types/booking";
import { useEffect } from "react";

export function useRefresh() {
  const router = useRouter();
  return useCallback(() => router.refresh(), [router]);
}

export function useFormAction(
  state: ActionState,
  onSuccess?: () => void,
  onClose?: () => void,
) {
  const { toast } = useToast();
  const refresh = useRefresh();

  useEffect(() => {
    if (state.error) {
      toast(state.error, "error");
    }
    if (state.success) {
      toast(state.success, "success");
      refresh();
      onSuccess?.();
      onClose?.();
    }
  }, [state.error, state.success, toast, refresh, onSuccess, onClose]);
}

export async function confirmDelete(message: string): Promise<boolean> {
  return window.confirm(message);
}
