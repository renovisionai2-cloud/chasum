"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AlertMessage } from "@/components/ui/form-feedback";
import { SlotPicker } from "@/components/scheduling/slot-picker";
import { createAppointment } from "@/lib/actions/appointments";
import { quickCreateCustomer } from "@/lib/actions/customers";
import { getDashboardAvailableSlots } from "@/lib/actions/scheduling";
import { useFormAction } from "@/hooks/use-form-action";
import type {
  ActionState,
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import { format } from "date-fns";
import { useActionState, useCallback, useMemo, useState } from "react";

type QuickAppointmentProps = {
  customers: Customer[];
  services: Service[];
  staff: StaffWithServices[];
  locations: Location[];
  preselectedCustomerId?: string | null;
  defaultSlotIso?: string | null;
  defaultServiceId?: string | null;
  defaultStaffId?: string | null;
  onSuccess: () => void;
  onCustomerCreated?: (customer: Customer) => void;
};

export function QuickAppointmentForm({
  customers: initialCustomers,
  services,
  staff,
  locations,
  preselectedCustomerId,
  defaultSlotIso,
  defaultServiceId,
  defaultStaffId,
  onSuccess,
  onCustomerCreated,
}: QuickAppointmentProps) {
  const { toast } = useToast();
  const [extraCustomers, setExtraCustomers] = useState<Customer[]>([]);
  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const c of initialCustomers) map.set(c.id, c);
    for (const c of extraCustomers) map.set(c.id, c);
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [initialCustomers, extraCustomers]);

  const [customerId, setCustomerId] = useState(preselectedCustomerId ?? "");
  const [serviceId, setServiceId] = useState(
    defaultServiceId ?? services.find((s) => s.is_active)?.id ?? "",
  );
  const [staffId, setStaffId] = useState(defaultStaffId ?? "");
  const [locationId, setLocationId] = useState(
    locations.find((l) => l.is_default)?.id ?? locations[0]?.id ?? "",
  );
  const [date, setDate] = useState(
    defaultSlotIso
      ? format(new Date(defaultSlotIso), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [slot, setSlot] = useState<string | null>(defaultSlotIso ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);

  const [state, formAction, pending] = useActionState(
    createAppointment,
    {} as ActionState,
  );

  useFormAction(state, onSuccess);

  const eligibleStaff = useMemo(() => {
    if (!serviceId) return staff.filter((m) => m.is_active);
    return staff.filter(
      (m) =>
        m.is_active &&
        m.staff_services.some((ss) => ss.service_id === serviceId),
    );
  }, [staff, serviceId]);

  const loadSlots = useCallback(
    (svcId: string, stfId: string, day: string) =>
      getDashboardAvailableSlots(
        svcId,
        stfId,
        day,
        undefined,
        locationId || undefined,
      ),
    [locationId],
  );

  async function handleQuickCreate() {
    setCreating(true);
    const result = await quickCreateCustomer({
      name: newName,
      email: newEmail,
      phone: newPhone || undefined,
    });
    setCreating(false);
    if (result.error || !result.customerId) {
      toast(result.error ?? "Could not create customer.", "error");
      return;
    }
    const created: Customer = {
      id: result.customerId,
      business_id: "",
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || null,
      notes: null,
      tags: [],
      referral_source: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setExtraCustomers((prev) => [...prev, created]);
    setCustomerId(result.customerId);
    setShowCreate(false);
    onCustomerCreated?.(created);
    toast("Customer added.", "success");
  }

  return (
    <section className="space-y-3">
      <h3 className="ds-section-title text-sm">Quick appointment</h3>

      {!showCreate ? (
        <div className="space-y-2">
          <Label htmlFor="qa_customer">Customer</Label>
          <Select
            id="qa_customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowCreate(true)}
          >
            Quick add customer
          </Button>
        </div>
      ) : (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-dashed border-border p-3">
          <Label htmlFor="qa_new_name">Name</Label>
          <Input
            id="qa_new_name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Label htmlFor="qa_new_email">Email</Label>
          <Input
            id="qa_new_email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Label htmlFor="qa_new_phone">Phone</Label>
          <Input
            id="qa_new_phone"
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={creating || !newName.trim() || !newEmail.trim()}
              onClick={() => void handleQuickCreate()}
            >
              {creating ? "Saving…" : "Save customer"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="customer_id" value={customerId} />
        <input type="hidden" name="service_id" value={serviceId} />
        <input type="hidden" name="staff_id" value={staffId} />
        <input type="hidden" name="location_id" value={locationId} />
        <input type="hidden" name="start_time" value={slot ?? ""} />
        <input type="hidden" name="status" value="confirmed" />

        <div className="space-y-2">
          <Label htmlFor="qa_service">Service</Label>
          <Select
            id="qa_service"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setStaffId("");
              setSlot(null);
            }}
          >
            {services
              .filter((s) => s.is_active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </Select>
        </div>

        {locations.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="qa_location">Location</Label>
            <Select
              id="qa_location"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setSlot(null);
              }}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="qa_staff">Staff</Label>
          <Select
            id="qa_staff"
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setSlot(null);
            }}
          >
            <option value="">Select staff…</option>
            {eligibleStaff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>

        {serviceId && staffId && (
          <SlotPicker
            serviceId={serviceId}
            staffId={staffId}
            date={date}
            selectedSlot={slot}
            onDateChange={(d) => {
              setDate(d);
              setSlot(null);
            }}
            onSelectSlot={setSlot}
            loadSlots={loadSlots}
          />
        )}

        <AlertMessage error={state.error} />
        <Button
          type="submit"
          className="w-full"
          disabled={pending || !customerId || !serviceId || !staffId || !slot}
        >
          {pending ? "Saving…" : "Save appointment"}
        </Button>
      </form>
    </section>
  );
}
