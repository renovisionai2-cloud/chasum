import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const createAppointmentBodySchema = z.object({
  service_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  status: z
    .enum([
      "pending",
      "confirmed",
      "arrived",
      "waiting",
      "in_progress",
      "cancelled",
      "completed",
      "no_show",
    ])
    .optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export const patchAppointmentBodySchema = z
  .object({
    service_id: z.string().uuid().optional(),
    staff_id: z.string().uuid().optional(),
    customer_id: z.string().uuid().optional(),
    start_time: z.string().min(1).optional(),
    end_time: z.string().min(1).optional(),
    status: z
      .enum([
        "pending",
        "confirmed",
        "arrived",
        "waiting",
        "in_progress",
        "cancelled",
        "completed",
        "no_show",
      ])
      .optional(),
    notes: z.string().max(4000).nullable().optional(),
  })
  .strict();

export const createCustomerBodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(40).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export const publicBookAppointmentSchema = z.object({
  slug: z.string().min(1).max(120),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  locationId: z.string().uuid(),
  startTime: z.string().min(1),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().max(320),
  customerPhone: z.string().max(40).optional(),
  notes: z.string().max(4000).optional(),
  inviteCode: z.string().max(120).optional(),
});

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
}
