"use client";

import { AiSuggestionsCard } from "@/components/reception/ai-suggestions-card";
import { CustomerPreview } from "@/components/reception/customer-preview";
import { CustomerSearch } from "@/components/reception/customer-search";
import { NextSlotCard } from "@/components/reception/next-slot-card";
import { QuickAppointmentForm } from "@/components/reception/quick-appointment";
import { TodayNotes } from "@/components/reception/today-notes";
import { ReceptionWaitlistPanel } from "@/components/reception/reception-waitlist-panel";
import { Button } from "@/components/ui/button";
import type { NextAvailableSlot } from "@/lib/actions/reception";
import type { BookingDraft } from "@/lib/booking/booking-draft";
import { pushRecentCustomer } from "@/lib/reception/recent-customers";
import type { DashboardInsight } from "@/lib/dashboard/insights";
import type {
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import {
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PANEL_WIDTH_KEY = "chasum.receptionPanelWidthPx";
const PANEL_MIN_PX = 380;
const PANEL_DEFAULT_PX = 480;
const PANEL_WIDE_PX = 640;
const PANEL_MAX_VIEWPORT_RATIO = 0.72;

type WaitlistEntry = {
  id: string;
  status: string;
  preferred_date: string;
  notes: string | null;
  priority?: number;
  customer?: { name?: string; email?: string } | null;
  service?: { name?: string } | null;
  staff?: { name?: string } | null;
};

type ReceptionPanelProps = {
  customers: Customer[];
  services: Service[];
  staff: StaffWithServices[];
  locations: Location[];
  insights: DashboardInsight[];
  waitlist?: WaitlistEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked: () => void;
  onOpenFullDialog: (
    draft?: BookingDraft | null,
    appointmentId?: string | null,
  ) => void;
  searchFocusSignal?: number;
  bookFocusSignal?: number;
  walkInSignal?: number;
  createCustomerSignal?: number;
};

function clampPanelWidth(width: number): number {
  if (typeof window === "undefined") {
    return Math.max(PANEL_MIN_PX, Math.min(width, PANEL_WIDE_PX));
  }
  const max = Math.floor(window.innerWidth * PANEL_MAX_VIEWPORT_RATIO);
  return Math.max(PANEL_MIN_PX, Math.min(width, max));
}

export function ReceptionPanel({
  customers,
  services,
  staff,
  locations,
  insights,
  waitlist = [],
  open,
  onOpenChange,
  onBooked,
  onOpenFullDialog,
  searchFocusSignal = 0,
  bookFocusSignal = 0,
  walkInSignal = 0,
  createCustomerSignal = 0,
}: ReceptionPanelProps) {
  const [selected, setSelected] = useState<Customer | null>(null);
  const [extraCustomers, setExtraCustomers] = useState<Customer[]>([]);
  const [slotDefaults, setSlotDefaults] = useState<{
    start?: string;
    serviceId?: string;
    staffId?: string;
  }>({});
  const formAnchorRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<BookingDraft | null>(null);
  const [confirmedAppointmentId, setConfirmedAppointmentId] = useState<
    string | null
  >(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [widthPx, setWidthPx] = useState(PANEL_DEFAULT_PX);
  const [isDesktop, setIsDesktop] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    try {
      const raw = window.localStorage.getItem(PANEL_WIDTH_KEY);
      if (raw) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) setWidthPx(clampPanelWidth(parsed));
      }
    } catch {
      /* ignore */
    }
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function onResize() {
      setWidthPx((w) => clampPanelWidth(w));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function persistWidth(next: number) {
    const clamped = clampPanelWidth(next);
    setWidthPx(clamped);
    try {
      window.localStorage.setItem(PANEL_WIDTH_KEY, String(clamped));
    } catch {
      /* ignore */
    }
  }

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startWidth: widthPx };
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const delta = dragRef.current.startX - e.clientX;
    persistWidth(dragRef.current.startWidth + delta);
  }

  function endDrag(e: React.PointerEvent) {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  const walkInMode = walkInSignal > 0;
  const apptFocusSignal = bookFocusSignal + walkInSignal;
  const isWide = widthPx >= PANEL_DEFAULT_PX + 40;

  useEffect(() => {
    if (createCustomerSignal <= 0) return;
    window.setTimeout(() => {
      formAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 40);
  }, [createCustomerSignal]);

  const allCustomers = (() => {
    const map = new Map<string, Customer>();
    for (const c of customers) map.set(c.id, c);
    for (const c of extraCustomers) map.set(c.id, c);
    return [...map.values()];
  })();

  if (!open) {
    return (
      <div className="hidden shrink-0 lg:block">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="sticky top-4 transition-shadow hover:shadow-sm"
          onClick={() => onOpenChange(true)}
          aria-label="Open reception panel"
        >
          <PanelRightOpen className="h-4 w-4" />
          Panel
        </Button>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "relative flex w-full shrink-0 flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm sm:p-5",
        "lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto",
        !isDesktop && "lg:w-[22rem] xl:w-[24rem]",
      )}
      style={isDesktop ? { width: widthPx, maxWidth: `${PANEL_MAX_VIEWPORT_RATIO * 100}vw` } : undefined}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize reception panel"
        aria-valuemin={PANEL_MIN_PX}
        aria-valuemax={
          typeof window !== "undefined"
            ? Math.floor(window.innerWidth * PANEL_MAX_VIEWPORT_RATIO)
            : PANEL_WIDE_PX
        }
        aria-valuenow={widthPx}
        tabIndex={0}
        className="absolute inset-y-3 -left-1.5 z-20 hidden w-3 cursor-col-resize touch-none lg:block"
        onPointerDown={startDrag}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            persistWidth(widthPx + 24);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            persistWidth(widthPx - 24);
          }
        }}
      >
        <span className="absolute inset-y-10 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-border" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Reception</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              /
            </kbd>{" "}
            search ·{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              N
            </kbd>{" "}
            new ·{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              B
            </kbd>{" "}
            book ·{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              W
            </kbd>{" "}
            walk-in
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 w-8 shrink-0 p-0 lg:inline-flex"
            onClick={() =>
              persistWidth(isWide ? PANEL_DEFAULT_PX : PANEL_WIDE_PX)
            }
            aria-label={
              isWide
                ? "Standard reception panel width"
                : "Expand reception panel"
            }
            title={isWide ? "Standard view" : "Wide view"}
          >
            {isWide ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0 transition-colors"
            onClick={() => onOpenChange(false)}
            aria-label="Close reception panel"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CustomerSearch
        selectedId={selected?.id}
        autoFocus
        focusSignal={searchFocusSignal}
        seedCustomers={allCustomers}
        onSelect={(c) => {
          pushRecentCustomer(c);
          setSelected(c);
          setExtraCustomers((prev) =>
            prev.some((x) => x.id === c.id) ? prev : [...prev, c],
          );
          window.setTimeout(() => {
            formAnchorRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 50);
        }}
      />

      <CustomerPreview customer={selected} />

      <div ref={formAnchorRef} className="scroll-mt-4">
        <QuickAppointmentForm
          key={`${selected?.id ?? "none"}-${slotDefaults.start ?? "blank"}-${walkInMode ? "wi" : "std"}-${walkInSignal}-${bookFocusSignal}`}
          customers={allCustomers}
          services={services}
          staff={staff}
          locations={locations}
          preselectedCustomerId={selected?.id}
          defaultSlotIso={slotDefaults.start}
          defaultServiceId={slotDefaults.serviceId}
          defaultStaffId={slotDefaults.staffId}
          walkInMode={walkInMode}
          focusSignal={apptFocusSignal}
          openCreateSignal={createCustomerSignal}
          onClearCustomer={() => setSelected(null)}
          onSuccess={onBooked}
          onCustomerCreated={(c) => {
            setExtraCustomers((prev) => [...prev, c]);
            setSelected(c);
            window.setTimeout(() => {
              formAnchorRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }, 80);
          }}
          onDraftChange={(draft) => {
            draftRef.current = draft;
          }}
          onAppointmentConfirmed={(id) => {
            setConfirmedAppointmentId(id);
            draftRef.current = null;
          }}
          onViewAppointment={(id) => {
            onOpenFullDialog(null, id);
          }}
          onStartNewDraft={() => {
            setConfirmedAppointmentId(null);
          }}
        />
      </div>

      {confirmedAppointmentId ? null : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => onOpenFullDialog(draftRef.current)}
        >
          Open Booking Sheet
        </Button>
      )}

      <div className="border-t border-border/60 pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-[var(--radius-md)] px-1 py-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={toolsOpen}
          onClick={() => setToolsOpen((v) => !v)}
        >
          More tools
          <span className="tabular-nums">{toolsOpen ? "Hide" : "Show"}</span>
        </button>
        {toolsOpen ? (
          <div className="mt-3 space-y-4">
            <NextSlotCard
              onBookSlot={(slot: NonNullable<NextAvailableSlot>) => {
                setSlotDefaults({
                  start: slot.start,
                  serviceId: slot.serviceId,
                  staffId: slot.staffId,
                });
                formAnchorRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
              }}
            />
            <TodayNotes />
            <AiSuggestionsCard insights={insights} />
            <ReceptionWaitlistPanel entries={waitlist} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
