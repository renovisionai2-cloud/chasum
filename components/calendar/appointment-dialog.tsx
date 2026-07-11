"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SlotPicker } from "@/components/scheduling/slot-picker";
import {
  cancelAppointment,
  createAppointment,
  updateAppointment,
} from "@/lib/actions/appointments";
import { getDashboardAvailableSlots } from "@/lib/actions/scheduling";
import type {
  ActionState,
  AppointmentStatus,
  AppointmentWithRelations,
  Customer,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { useFormAction } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { format } from "date-fns";
import { parseISO } from "@/lib/calendar/utils";
import { useActionState, useCallback, useMemo, useState } from "react";

type AppointmentDialogProps = {
  open: boolean;
  onClose: () => void;
  appointment?: AppointmentWithRelations | null;
  services: Service[];
  staff: StaffWithServices[];
  customers: Customer[];
  defaultDate?: Date;
  onSuccess: () => void;
};

function slotDateInLocalTimezone(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}

function getInitialState(
  appointment: AppointmentWithRelations | null | undefined,
  services: Service[],
  defaultDate?: Date,
) {
  const initialStart = appointment
    ? appointment.start_time
    : defaultDate?.toISOString() ?? null;

  return {
    serviceId:
      appointment?.service_id ?? services.find((s) => s.is_active)?.id ?? "",
    staffId: appointment?.staff_id ?? "",
    date: initialStart
      ? slotDateInLocalTimezone(initialStart)
      : format(new Date(), "yyyy-MM-dd"),
    slot: initialStart,
  };
}

export function AppointmentDialog({
  open,
  onClose,
  appointment,
  services,
  staff,
  customers,
  defaultDate,
  onSuccess,
}: AppointmentDialogProps) {
  const isEditing = !!appointment;
  const action = isEditing ? updateAppointment : createAppointment;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const { toast } = useToast();

  const initial = getInitialState(appointment, services, defaultDate);
  const [selectedService, setSelectedService] = useState(initial.serviceId);
  const [selectedStaff, setSelectedStaff] = useState(initial.staffId);
  const [selectedDate, setSelectedDate] = useState(initial.date);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initial.slot);

  const loadSlots = useCallback(
    (
      serviceId: string,
      staffId: string,
      date: string,
      excludeAppointmentId?: string,
    ) => getDashboardAvailableSlots(serviceId, staffId, date, excludeAppointmentId),
    [],
  );

  useFormAction(state, onSuccess, onClose);

  const filteredStaff = useMemo(
    () =>
      staff.filter(
        (member) =>
          member.is_active &&
          member.staff_services.some((ss) => ss.service_id === selectedService),
      ),
    [staff, selectedService],
  );

  const activeStaffId = useMemo(() => {
    if (filteredStaff.some((member) => member.id === selectedStaff)) {
      return selectedStaff;
    }
    return filteredStaff[0]?.id ?? "";
  }, [filteredStaff, selectedStaff]);

  const canSubmit = !!selectedService && !!activeStaffId && !!selectedSlot;

  async function handleCancel() {
    if (!appointment) return;
    if (!confirm("Cancel this appointment?")) return;
    const result = await cancelAppointment(appointment.id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Appointment cancelled.", "success");
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit appointment" : "New appointment"}
      description={
        isEditing
          ? "Update appointment details or pick a new available time."
          : "Select service, staff, and an available time slot."
      }
    >
      <form action={formAction} className="space-y-4">
        {isEditing && (
          <input type="hidden" name="id" value={appointment.id} />
        )}

        <div className="space-y-2">
          <Label htmlFor="customer_id">Customer</Label>
          <Select
            id="customer_id"
            name="customer_id"
            defaultValue={appointment?.customer_id ?? ""}
            required
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.email})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_id">Service</Label>
          <Select
            id="service_id"
            name="service_id"
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setSelectedStaff("");
              setSelectedSlot(null);
            }}
            required
          >
            <option value="">Select service</option>
            {services.filter((s) => s.is_active).map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration_minutes} min)
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff_id">Staff</Label>
          <Select
            id="staff_id"
            name="staff_id"
            value={activeStaffId}
            onChange={(e) => {
              setSelectedStaff(e.target.value);
              setSelectedSlot(null);
            }}
            required
          >
            <option value="">Select staff</option>
            {filteredStaff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>

        {selectedService && activeStaffId ? (
          <SlotPicker
            serviceId={selectedService}
            staffId={activeStaffId}
            date={selectedDate}
            selectedSlot={selectedSlot}
            onDateChange={(value) => {
              setSelectedDate(value);
              setSelectedSlot(null);
            }}
            onSelectSlot={setSelectedSlot}
            loadSlots={loadSlots}
            excludeAppointmentId={appointment?.id}
          />
        ) : null}

        <input type="hidden" name="start_time" value={selectedSlot ?? ""} />

        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={appointment.status}
            >
              {(Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map(
                (status) => (
                  <option key={status} value={status}>
                    {APPOINTMENT_STATUS_LABELS[status]}
                  </option>
                ),
              )}
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={appointment?.notes ?? ""}
            placeholder="Optional notes..."
          />
        </div>

        <AlertMessage error={state.error} />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
          {isEditing && appointment.status !== "cancelled" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="text-destructive hover:text-destructive"
            >
              Cancel appointment
            </Button>
          )}
          <FormFooter
            onCancel={onClose}
            pending={pending}
            submitLabel={isEditing ? "Save changes" : "Create"}
            submitDisabled={!canSubmit}
          />
        </div>
      </form>
    </Dialog>
  );
}
