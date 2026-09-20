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
import {
  PANEL_VIEWPORT_GUTTER_PX,
  RECEPTION_SSR_VIEWPORT_WIDTH_PX,
  receptionWorkspaceLayout,
} from "@/lib/reception/panel-layout";
import type { TaxRate } from "@/lib/business/types";
import type { DashboardInsight } from "@/lib/dashboard/insights";
import type {
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const LEGACY_PANEL_WIDTH_KEY = "chasum.receptionPanelWidthPx";

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
  taxRates?: TaxRate[];
  currency?: string | null;
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

export function ReceptionPanel({
  customers,
  services,
  staff,
  locations,
  taxRates = [],
  currency = "usd",
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
  const [viewportWidth, setViewportWidth] = useState(
    RECEPTION_SSR_VIEWPORT_WIDTH_PX,
  );

  useLayoutEffect(() => {
    const sync = () => setViewportWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    try {
      window.localStorage.removeItem(LEGACY_PANEL_WIDTH_KEY);
    } catch {
      /* ignore */
    }
    return () => window.removeEventListener("resize", sync);
  }, []);

  const layout = receptionWorkspaceLayout(viewportWidth);
  const walkInMode = walkInSignal > 0;
  const apptFocusSignal = bookFocusSignal + walkInSignal;

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
    <div
      data-testid="reception-flex-slot"
      data-occupies-flex={layout.occupiesFlexSpace ? "true" : "false"}
      className={cn(
        layout.mode === "overlay" &&
          "pointer-events-none fixed top-16 right-0 bottom-0 z-30",
        layout.mode === "side-by-side" && "shrink-0",
        layout.mode === "stacked" && "w-full",
      )}
      style={
        layout.mode === "overlay" ? { width: layout.panelWidthPx } : undefined
      }
    >
      <aside
        data-testid="reception-panel"
        data-layout-mode={layout.mode}
        data-panel-width={String(layout.panelWidthPx)}
        className={cn(
          "relative flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm sm:p-5",
          layout.mode === "overlay" &&
            "pointer-events-auto h-full max-h-none overflow-y-auto rounded-none border-y-0 border-r-0 shadow-lg",
          layout.mode === "side-by-side" &&
            (confirmedAppointmentId
              ? "lg:sticky lg:top-4 lg:h-fit lg:max-h-none"
              : "lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"),
          layout.mode === "stacked" && "w-full",
        )}
        style={
          layout.mode === "stacked"
            ? { maxWidth: `calc(100vw - ${PANEL_VIEWPORT_GUTTER_PX}px)` }
            : {
                width: layout.panelWidthPx,
                maxWidth: `calc(100vw - ${PANEL_VIEWPORT_GUTTER_PX}px)`,
              }
        }
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-2 bg-card">
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

        {confirmedAppointmentId ? null : (
          <CustomerPreview customer={selected} />
        )}

        <div ref={formAnchorRef} className="scroll-mt-4">
          <QuickAppointmentForm
            key={`${selected?.id ?? "none"}-${slotDefaults.start ?? "blank"}-${walkInMode ? "wi" : "std"}-${walkInSignal}-${bookFocusSignal}`}
            customers={allCustomers}
            services={services}
            staff={staff}
            locations={locations}
            taxRates={taxRates}
            currency={currency}
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

        {confirmedAppointmentId ? null : (
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
        )}
      </aside>
    </div>
  );
}
