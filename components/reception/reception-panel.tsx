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
import type { DashboardInsight } from "@/lib/dashboard/insights";
import type {
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState } from "react";

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
}: ReceptionPanelProps) {
  const [selected, setSelected] = useState<Customer | null>(null);
  const [extraCustomers, setExtraCustomers] = useState<Customer[]>([]);
  const [slotDefaults, setSlotDefaults] = useState<{
    start?: string;
    serviceId?: string;
    staffId?: string;
  }>({});

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
          className="sticky top-4"
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
    <aside className="flex w-full shrink-0 flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:w-[22rem] lg:overflow-y-auto xl:w-[24rem]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Reception</h2>
          <p className="text-xs text-muted-foreground">
            Search, book, and assist without leaving the calendar
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onOpenChange(false)}
          aria-label="Close reception panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <CustomerSearch
        selectedId={selected?.id}
        onSelect={(c) => {
          setSelected(c);
          setExtraCustomers((prev) =>
            prev.some((x) => x.id === c.id) ? prev : [...prev, c],
          );
        }}
      />

      <CustomerPreview customer={selected} />

      <QuickAppointmentForm
        key={`${selected?.id ?? "none"}-${slotDefaults.start ?? "blank"}`}
        customers={allCustomers}
        services={services}
        staff={staff}
        locations={locations}
        preselectedCustomerId={selected?.id}
        defaultSlotIso={slotDefaults.start}
        defaultServiceId={slotDefaults.serviceId}
        defaultStaffId={slotDefaults.staffId}
        onSuccess={onBooked}
        onCustomerCreated={(c) => {
          setExtraCustomers((prev) => [...prev, c]);
          setSelected(c);
        }}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onOpenFullDialog}
        >
          Full appointment form
        </Button>
      </div>

      <NextSlotCard
        onBookSlot={(slot: NonNullable<NextAvailableSlot>) => {
          setSlotDefaults({
            start: slot.start,
            serviceId: slot.serviceId,
            staffId: slot.staffId,
          });
        }}
      />

      <WaitlistPlaceholder />
      <TodayNotes />
      <AiSuggestionsCard insights={insights} />
    </aside>
  );
}
