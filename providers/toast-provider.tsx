"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-border bg-card text-foreground",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      setToasts((prev) => {
        // Avoid stacking identical toasts (repeated save blink).
        if (prev.some((t) => t.message === message && t.variant === variant)) {
          return prev;
        }
        const id = crypto.randomUUID();
        window.setTimeout(() => dismiss(id), 4000);
        return [...prev, { id, message, variant }];
      });
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:inset-x-auto sm:right-4 sm:max-w-sm sm:px-0",
        )}
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg animate-fade-in-up",
              variantStyles[t.variant],
            )}
          >
            <span className="leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="h-8 w-8 shrink-0 rounded-md p-1.5 opacity-70 touch-manipulation hover:opacity-100 ds-focus-ring"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
