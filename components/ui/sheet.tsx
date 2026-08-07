"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

export const BOOKING_SHEET_WIDTH_KEY = "chasum.bookingSheetWidthPx";
export const BOOKING_SHEET_NARROW_PX = 440;
export const BOOKING_SHEET_STANDARD_PX = 600;
export const BOOKING_SHEET_WIDE_PX = 820;
/** Existing-appointment management workspace (desktop expanded). */
export const BOOKING_SHEET_MANAGEMENT_MAX_PX = 1180;
const SHEET_MIN_PX = 400;
const SHEET_MAX_VIEWPORT_RATIO = 0.78;
const SHEET_MANAGEMENT_VIEWPORT_RATIO = 0.68;

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
  side?: "right" | "left";
  /** When set, enables desktop width presets + drag resize. */
  resizable?: boolean;
  /** Show Narrow/Standard/Wide buttons when resizable. Default false — production UX. */
  showWidthControls?: boolean;
  /** Fixed desktop width in px when resizable (default standard). */
  defaultWidthPx?: number;
  /** localStorage key for remembered width (defaults to booking sheet key). */
  widthStorageKey?: string;
  /**
   * Desktop width mode. `management` expands the existing-appointment workspace
   * (~60–70vw, capped) without Narrow/Standard/Wide controls.
   */
  widthMode?: "default" | "management";
};

function clampWidth(
  width: number,
  maxRatio = SHEET_MAX_VIEWPORT_RATIO,
  absoluteMax = BOOKING_SHEET_WIDE_PX,
): number {
  if (typeof window === "undefined") {
    return Math.max(SHEET_MIN_PX, Math.min(width, absoluteMax));
  }
  const max = Math.min(
    absoluteMax,
    Math.floor(window.innerWidth * maxRatio),
  );
  return Math.max(SHEET_MIN_PX, Math.min(width, max));
}

/**
 * Unified sheet shell — right drawer on desktop, bottom sheet on mobile.
 * Optional desktop resize (narrow / standard / wide + drag).
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  headerActions,
  className,
  side = "right",
  resizable = false,
  showWidthControls = false,
  defaultWidthPx = BOOKING_SHEET_STANDARD_PX,
  widthStorageKey = BOOKING_SHEET_WIDTH_KEY,
  widthMode = "default",
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const managementMode = widthMode === "management";
  const [widthPx, setWidthPx] = useState(() => {
    if (typeof window === "undefined") return defaultWidthPx;
    try {
      const raw = window.localStorage.getItem(widthStorageKey);
      const parsed = raw ? Number(raw) : NaN;
      if (Number.isFinite(parsed)) return clampWidth(parsed);
    } catch {
      /* ignore */
    }
    return defaultWidthPx;
  });
  const [isDesktop, setIsDesktop] = useState(false);
  const [managementWidthPx, setManagementWidthPx] = useState(
    BOOKING_SHEET_MANAGEMENT_MAX_PX,
  );
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (!resizable && !managementMode) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      setIsDesktop(mq.matches);
      if (managementMode) {
        setManagementWidthPx(
          clampWidth(
            BOOKING_SHEET_MANAGEMENT_MAX_PX,
            SHEET_MANAGEMENT_VIEWPORT_RATIO,
            BOOKING_SHEET_MANAGEMENT_MAX_PX,
          ),
        );
      }
    };
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, [resizable, managementMode]);

  const persistWidth = useCallback(
    (next: number) => {
      const clamped = clampWidth(next);
      setWidthPx(clamped);
      try {
        window.localStorage.setItem(widthStorageKey, String(clamped));
      } catch {
        /* ignore */
      }
    },
    [widthStorageKey],
  );

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      const preferred = panelRef.current?.querySelector<HTMLElement>(
        "[data-sheet-autofocus]",
      );
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (preferred ?? first)?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!resizable || !isDesktop || managementMode) return;
    function onMove(e: PointerEvent) {
      if (!dragRef.current) return;
      const delta =
        side === "right"
          ? dragRef.current.startX - e.clientX
          : e.clientX - dragRef.current.startX;
      persistWidth(dragRef.current.startWidth + delta);
    }
    function onUp() {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [resizable, isDesktop, persistWidth, side, managementMode]);

  if (!open) return null;

  const desktopWidthStyle =
    isDesktop && managementMode
      ? { width: `${managementWidthPx}px`, maxWidth: "100%" }
      : resizable && isDesktop
        ? { width: `${widthPx}px`, maxWidth: "100%" }
        : undefined;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        "items-end justify-center",
        "md:items-stretch",
        side === "right" ? "md:justify-end" : "md:justify-start",
      )}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] motion-safe:transition-opacity"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        style={desktopWidthStyle}
        className={cn(
          "relative z-10 flex w-full flex-col border-border bg-card shadow-xl",
          "max-h-[92dvh] rounded-t-[var(--radius-lg)] border",
          "pb-[env(safe-area-inset-bottom)]",
          resizable || managementMode
            ? "md:h-full md:max-h-none md:rounded-none md:pb-0"
            : "md:h-full md:max-h-none md:w-[min(44rem,100%)] md:rounded-none md:pb-0",
          managementMode &&
            "motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out",
          side === "right"
            ? "md:border-l md:border-y-0 md:border-r-0"
            : "md:border-r md:border-y-0 md:border-l-0",
          className,
        )}
      >
        {resizable && isDesktop && !managementMode ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize booking panel"
            tabIndex={0}
            className={cn(
              "absolute top-0 z-20 hidden h-full w-1.5 cursor-col-resize touch-none bg-transparent hover:bg-primary/20 focus-visible:bg-primary/25 focus-visible:outline-none md:block",
              side === "right" ? "left-0" : "right-0",
            )}
            onPointerDown={(e) => {
              e.preventDefault();
              dragRef.current = { startX: e.clientX, startWidth: widthPx };
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                persistWidth(
                  widthPx + (side === "right" ? 24 : -24),
                );
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                persistWidth(
                  widthPx + (side === "right" ? -24 : 24),
                );
              }
            }}
          />
        ) : null}

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="truncate text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-0.5 text-sm text-muted-foreground"
              >
                {description}
              </p>
            ) : null}
            {resizable && isDesktop && showWidthControls ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {(
                  [
                    ["Narrow", BOOKING_SHEET_NARROW_PX],
                    ["Standard", BOOKING_SHEET_STANDARD_PX],
                    ["Wide", BOOKING_SHEET_WIDE_PX],
                  ] as const
                ).map(([label, px]) => (
                  <Button
                    key={label}
                    type="button"
                    size="sm"
                    variant={
                      Math.abs(widthPx - px) < 24 ? "secondary" : "ghost"
                    }
                    className="h-7 px-2 text-[11px]"
                    onClick={() => persistWidth(px)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 touch-manipulation"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        {footer ? (
          <footer className="sticky bottom-0 shrink-0 border-t border-border bg-card/95 px-5 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
