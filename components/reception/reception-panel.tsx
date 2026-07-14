"use client";

import { AiSuggestionsCard } from "@/components/reception/ai-suggestions-card";
import { CustomerPreview } from "@/components/reception/customer-preview";
import { CustomerSearch } from "@/components/reception/customer-search";
import { NextSlotCard } from "@/components/reception/next-slot-card";
import { QuickAppointmentForm } from "@/components/reception/quick-appointment";
import { TodayNotes } from "@/components/reception/today-notes";
import { WaitlistPlaceholder } from "@/components/reception/waitlist-placeholder";
import { Button } from "@/components/ui/button";
import type { NextAvailableSlot } from "@/lib/actions/reception";
import { pushRecentCustomer } from "@/lib/reception/recent-customers";
import type { DashboardInsight } from "@/lib/dashboard/insights";
import type {
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ReceptionPanelProps = {
  customers: Customer[];
  services: Service[];
  staff: StaffWithServices[];
  locations: Location[];
  insights: DashboardInsight[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked: () => void;
  onOpenFullDialog: () => void;
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
  insights,
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
    <aside className="flex w-full shrink-0 flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm sm:p-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:w-[22rem] lg:overflow-y-auto xl:w-[24rem]">
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
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
        onClick={onOpenFullDialog}
      >
        Open full appointment editor
      </Button>

      <div className="space-y-5 border-t border-border/80 pt-5">
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
        <WaitlistPlaceholder />
      </div>
    </aside>
  );
}
