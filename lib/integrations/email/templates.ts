import { getAppUrl } from "@/lib/env";
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand/assets";
import { format, parseISO } from "date-fns";
import type { AppointmentNotificationContext } from "@/lib/types/integrations";

function brandLogoUrl(): string {
  return `${getAppUrl()}${BRAND_ASSETS.logoHorizontal}`;
}

function layout(content: string, businessName: string): string {
  const logo = brandLogoUrl();
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="padding:28px 32px 12px;">
          <img src="${logo}" width="168" height="36" alt="${BRAND_NAME}" style="display:block;border:0;height:36px;width:auto;max-width:168px;" />
          <h1 style="margin:18px 0 0;font-size:22px;font-weight:600;color:#0b1324;">${businessName}</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;color:#334155;font-size:15px;line-height:1.6;">
          ${content}
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e2e8f0;font-size:12px;color:#334155;">
          Sent by ${BRAND_NAME} · ${BRAND_TAGLINE}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function formatAppointmentTime(iso: string): string {
  return format(parseISO(iso), "EEEE, MMMM d 'at' h:mm a");
}

function detailBlock(ctx: AppointmentNotificationContext): string {
  return `
    <p style="margin:0 0 16px;">Hi ${ctx.customerName},</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;color:#71717a;width:100px;">Service</td><td style="padding:8px 0;font-weight:500;color:#0c1222;">${ctx.serviceName}</td></tr>
      <tr><td style="padding:8px 0;color:#71717a;">Provider</td><td style="padding:8px 0;font-weight:500;color:#0c1222;">${ctx.staffName}</td></tr>
      <tr><td style="padding:8px 0;color:#71717a;">When</td><td style="padding:8px 0;font-weight:500;color:#0c1222;">${formatAppointmentTime(ctx.startTime)}</td></tr>
    </table>`;
}

export type EmailTemplate = {
  key: string;
  subject: string;
  html: string;
  text: string;
};

export function renderConfirmationEmail(
  ctx: AppointmentNotificationContext,
): EmailTemplate {
  const content = `${detailBlock(ctx)}
    <p style="margin:16px 0 0;">Your appointment is confirmed. We look forward to seeing you!</p>`;
  return {
    key: "appointment.confirmation",
    subject: `Confirmed: ${ctx.serviceName} on ${format(parseISO(ctx.startTime), "MMM d")}`,
    html: layout(content, ctx.businessName),
    text: `Your ${ctx.serviceName} appointment with ${ctx.staffName} is confirmed for ${formatAppointmentTime(ctx.startTime)}.`,
  };
}

export function renderReminderEmail(
  ctx: AppointmentNotificationContext,
): EmailTemplate {
  const content = `${detailBlock(ctx)}
    <p style="margin:16px 0 0;">This is a friendly reminder about your upcoming appointment.</p>`;
  return {
    key: "appointment.reminder",
    subject: `Reminder: ${ctx.serviceName} tomorrow`,
    html: layout(content, ctx.businessName),
    text: `Reminder: ${ctx.serviceName} with ${ctx.staffName} on ${formatAppointmentTime(ctx.startTime)}.`,
  };
}

export function renderCancellationEmail(
  ctx: AppointmentNotificationContext,
): EmailTemplate {
  const content = `${detailBlock(ctx)}
    <p style="margin:16px 0 0;">Your appointment has been cancelled. Contact us if you'd like to rebook.</p>`;
  return {
    key: "appointment.cancellation",
    subject: `Cancelled: ${ctx.serviceName} on ${format(parseISO(ctx.startTime), "MMM d")}`,
    html: layout(content, ctx.businessName),
    text: `Your ${ctx.serviceName} appointment on ${formatAppointmentTime(ctx.startTime)} has been cancelled.`,
  };
}

export function renderRescheduleEmail(
  ctx: AppointmentNotificationContext,
  previousStartTime: string,
): EmailTemplate {
  const content = `${detailBlock(ctx)}
    <p style="margin:8px 0 0;color:#71717a;font-size:14px;">Previously: ${formatAppointmentTime(previousStartTime)}</p>
    <p style="margin:16px 0 0;">Your appointment has been rescheduled to the new time above.</p>`;
  return {
    key: "appointment.reschedule",
    subject: `Rescheduled: ${ctx.serviceName}`,
    html: layout(content, ctx.businessName),
    text: `Your ${ctx.serviceName} appointment has been rescheduled to ${formatAppointmentTime(ctx.startTime)}.`,
  };
}

export function renderStaffNotificationEmail(
  ctx: AppointmentNotificationContext,
  action: string,
): EmailTemplate {
  const content = `
    <p style="margin:0 0 16px;">Hi ${ctx.staffName},</p>
    <p style="margin:0 0 16px;">Appointment ${action}:</p>
    ${detailBlock(ctx)}`;
  return {
    key: "appointment.staff",
    subject: `[Staff] ${action}: ${ctx.customerName} — ${ctx.serviceName}`,
    html: layout(content, ctx.businessName),
    text: `Appointment ${action}: ${ctx.customerName}, ${ctx.serviceName}, ${formatAppointmentTime(ctx.startTime)}.`,
  };
}

export function renderBusinessNotificationEmail(
  ctx: AppointmentNotificationContext,
  action: string,
): EmailTemplate {
  const content = `
    <p style="margin:0 0 16px;">New activity on your calendar:</p>
    <p style="margin:0 0 8px;font-weight:600;">${action}</p>
    ${detailBlock(ctx)}`;
  return {
    key: "appointment.business",
    subject: `[${ctx.businessName}] ${action}`,
    html: layout(content, ctx.businessName),
    text: `${action}: ${ctx.customerName}, ${ctx.serviceName}, ${formatAppointmentTime(ctx.startTime)}.`,
  };
}

export function renderSmsReminder(ctx: AppointmentNotificationContext): string {
  return `Reminder: ${ctx.serviceName} with ${ctx.staffName} at ${format(parseISO(ctx.startTime), "h:mm a")} on ${format(parseISO(ctx.startTime), "MMM d")}. — ${ctx.businessName}`;
}

export function renderSmsCancellation(ctx: AppointmentNotificationContext): string {
  return `Your ${ctx.serviceName} appointment on ${format(parseISO(ctx.startTime), "MMM d 'at' h:mm a")} has been cancelled. — ${ctx.businessName}`;
}

export function renderSmsReschedule(ctx: AppointmentNotificationContext): string {
  return `Your ${ctx.serviceName} appointment has been rescheduled to ${format(parseISO(ctx.startTime), "MMM d 'at' h:mm a")}. — ${ctx.businessName}`;
}
