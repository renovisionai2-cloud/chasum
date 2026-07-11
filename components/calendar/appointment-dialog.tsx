"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelAppointment,
  createAppointment,
  updateAppointment,
} from "@/lib/actions/appointments";
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
import { useActionState, useState } from "react";

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

function toDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function toTimeInput(date: Date): string {
  return format(date, "HH:mm");
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
  const [selectedService, setSelectedService] = useState(
    appointment?.service_id ?? services[0]?.id ?? "",
  );
  const { toast } = useToast();

  useFormAction(state, onSuccess, onClose);

  const filteredStaff = staff.filter(
    (member) =>
      member.is_active &&
      member.staff_services.some((ss) => ss.service_id === selectedService),
  );

  const defaultStart = appointment
    ? parseISO(appointment.start_time)
    : defaultDate ?? new Date();

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
          ? "Update appointment details or change status."
          : "Schedule a new appointment for a customer."
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
            onChange={(e) => setSelectedService(e.target.value)}
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
            defaultValue={appointment?.staff_id ?? filteredStaff[0]?.id ?? ""}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={toDateInput(defaultStart)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              name="time"
              type="time"
              defaultValue={toTimeInput(defaultStart)}
              required
            />
          </div>
        </div>

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
          <FormFooter onCancel={onClose} pending={pending} submitLabel={isEditing ? "Save changes" : "Create"} />
        </div>
      </form>
    </Dialog>
  );
}
