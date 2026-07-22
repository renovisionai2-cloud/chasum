import { getAppUrl } from "@/lib/env";
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand/assets";
import type {
  AppointmentTemplateContext,
  BrandingContext,
  RenderedTemplate,
} from "@/lib/communications/types";
import { format, parseISO } from "date-fns";

function money(cents: number | null | undefined): string {
  if (cents == null) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

function brand(ctx: AppointmentTemplateContext): BrandingContext {
  return (
    ctx.branding ?? {
      businessName: ctx.businessName,
      logoUrl: `${getAppUrl()}${BRAND_ASSETS.logoHorizontal}`,
      optOutFooter: null,
    }
  );
}

function layout(
  content: string,
  branding: BrandingContext,
  accent?: string | null,
): string {
  const logo =
    branding.logoUrl || `${getAppUrl()}${BRAND_ASSETS.logoHorizontal}`;
  const color = accent || branding.primaryColor || "#0b1324";
  const footer =
    branding.optOutFooter?.trim() ||
    `Sent by ${BRAND_NAME} · ${BRAND_TAGLINE}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="padding:28px 32px 12px;border-top:4px solid ${color};">
          <img src="${logo}" width="168" height="36" alt="${branding.businessName}" style="display:block;border:0;height:36px;width:auto;max-width:168px;" />
          <h1 style="margin:18px 0 0;font-size:22px;font-weight:600;color:${color};font-family:system-ui,-apple-system,sans-serif;">${branding.businessName}</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;color:#334155;font-size:15px;line-height:1.6;font-family:system-ui,-apple-system,sans-serif;">
          ${content}
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;font-family:system-ui,-apple-system,sans-serif;">
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function whenLabel(iso: string): string {
  return format(parseISO(iso), "EEEE, MMMM d 'at' h:mm a");
}

function appointmentDetails(ctx: AppointmentTemplateContext): string {
  return `
    <p style="margin:0 0 16px;">Hi ${ctx.customerName},</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;color:#64748b;width:110px;">Service</td><td style="padding:8px 0;font-weight:500;color:#0f172a;">${ctx.serviceName}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Provider</td><td style="padding:8px 0;font-weight:500;color:#0f172a;">${ctx.staffName}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">When</td><td style="padding:8px 0;font-weight:500;color:#0f172a;">${whenLabel(ctx.startTime)}</td></tr>
    </table>`;
}

export function renderEmailTemplate(
  key: string,
  ctx: AppointmentTemplateContext,
): RenderedTemplate {
  const b = brand(ctx);

  switch (key) {
    case "appointment.confirmation": {
      const content = `${appointmentDetails(ctx)}
        <p style="margin:16px 0 0;">You're all set — we look forward to seeing you.</p>`;
      return {
        key,
        subject: `You're booked — ${ctx.serviceName} on ${format(parseISO(ctx.startTime), "MMM d")}`,
        html: layout(content, b),
        text: `You're booked for ${ctx.serviceName} with ${ctx.staffName} on ${whenLabel(ctx.startTime)}.`,
      };
    }
    case "appointment.reminder": {
      const content = `${appointmentDetails(ctx)}
        <p style="margin:16px 0 0;">Just a friendly reminder — we can't wait to see you.</p>`;
      return {
        key,
        subject: `Reminder: ${ctx.serviceName} coming up`,
        html: layout(content, b),
        text: `Reminder: ${ctx.serviceName} with ${ctx.staffName} on ${whenLabel(ctx.startTime)}.`,
      };
    }
    case "appointment.reschedule": {
      const prev = ctx.previousStartTime
        ? `<p style="margin:8px 0 0;color:#64748b;font-size:14px;">Previously: ${whenLabel(ctx.previousStartTime)}</p>`
        : "";
      const content = `${appointmentDetails(ctx)}${prev}
        <p style="margin:16px 0 0;">Your appointment has a new time. See you then.</p>`;
      return {
        key,
        subject: `Updated time — ${ctx.serviceName}`,
        html: layout(content, b),
        text: `Your ${ctx.serviceName} appointment is now ${whenLabel(ctx.startTime)}.`,
      };
    }
    case "appointment.cancellation": {
      const content = `${appointmentDetails(ctx)}
        <p style="margin:16px 0 0;">This appointment has been cancelled. Reply anytime if you'd like to rebook — we'd love to have you back.</p>`;
      return {
        key,
        subject: `Cancelled — ${ctx.serviceName} on ${format(parseISO(ctx.startTime), "MMM d")}`,
        html: layout(content, b),
        text: `Your ${ctx.serviceName} on ${whenLabel(ctx.startTime)} has been cancelled.`,
      };
    }
    case "commerce.invoice": {
      const content = `
        <p style="margin:0 0 16px;">Hi ${ctx.customerName},</p>
        <p>Your invoice ${ctx.invoiceNumber ?? ""} from <strong>${ctx.businessName}</strong> is ready.</p>
        <p style="font-size:20px;font-weight:600;margin:16px 0;">${money(ctx.amountCents)}</p>
        <p style="margin:0;color:#475569;font-size:14px;">Questions? Reply to this email or contact the studio directly.</p>`;
      return {
        key,
        subject: `Invoice ${ctx.invoiceNumber ?? ""} from ${ctx.businessName}`,
        html: layout(content, b),
        text: `Invoice ${ctx.invoiceNumber ?? ""} for ${money(ctx.amountCents)} from ${ctx.businessName}.`,
      };
    }
    case "commerce.receipt": {
      const content = `
        <p style="margin:0 0 16px;">Hi ${ctx.customerName},</p>
        <p>Thank you — payment received. Here's your receipt ${ctx.receiptNumber ?? ""}.</p>
        <p style="font-size:20px;font-weight:600;margin:16px 0;">${money(ctx.amountCents)}</p>
        <p style="margin:0;color:#475569;font-size:14px;">We appreciate your business.</p>`;
      return {
        key,
        subject: `Your receipt from ${ctx.businessName}`,
        html: layout(content, b),
        text: `Receipt ${ctx.receiptNumber ?? ""} for ${money(ctx.amountCents)} from ${ctx.businessName}. Thank you!`,
      };
    }
    case "commerce.gift_certificate": {
      const code = ctx.invoiceNumber ?? "GIFT";
      const content = `
        <p style="margin:0 0 16px;">Hi ${ctx.customerName || "there"},</p>
        <p style="margin:0 0 12px;">${ctx.staffName && ctx.staffName !== "Team" ? `<strong>${ctx.staffName}</strong> sent you` : "You've received"} a gift certificate from <strong>${ctx.businessName}</strong>.</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.08em;margin:24px 0 8px;font-family:ui-monospace,monospace;color:#0f172a;">${code}</p>
        <p style="font-size:18px;font-weight:600;margin:0 0 16px;">Value ${money(ctx.amountCents)}</p>
        <p style="margin:0 0 8px;color:#475569;font-size:14px;">Save this email — present the code when you redeem in-store or online.</p>
        ${
          ctx.customMessage
            ? `<div style="white-space:pre-wrap;font-size:14px;line-height:1.5;background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;margin:16px 0 0;color:#334155;">${ctx.customMessage}</div>`
            : ""
        }`;
      return {
        key,
        subject: `A gift for you from ${ctx.businessName}`,
        html: layout(content, b),
        text:
          ctx.customMessage ||
          `Gift certificate ${code} for ${money(ctx.amountCents)} from ${ctx.businessName}.`,
      };
    }
    case "commerce.deposit_request": {
      const content = `${appointmentDetails(ctx)}
        <p style="margin:16px 0 0;">A deposit of <strong>${money(ctx.amountCents)}</strong> holds your appointment. Pay at your convenience — we'll confirm once it's received.</p>`;
      return {
        key,
        subject: `Deposit to hold your ${ctx.serviceName}`,
        html: layout(content, b),
        text: `Deposit of ${money(ctx.amountCents)} requested for ${ctx.serviceName} on ${whenLabel(ctx.startTime)}.`,
      };
    }
    case "auth.welcome": {
      const content = `
        <p style="margin:0 0 16px;">Welcome to ${ctx.businessName}!</p>
        <p>Your account is ready. Book online anytime and manage your visits from one place.</p>`;
      return {
        key,
        subject: `Welcome to ${ctx.businessName}`,
        html: layout(content, b),
        text: `Welcome to ${ctx.businessName}! Your account is ready.`,
      };
    }
    case "auth.password_reset": {
      const content = `
        <p style="margin:0 0 16px;">Hi ${ctx.customerName || "there"},</p>
        <p>A password reset was requested for your ${ctx.businessName} account. Use your secure reset link from the app to continue.</p>
        <p style="color:#64748b;font-size:13px;">If you did not request this, you can ignore this email.</p>`;
      return {
        key,
        subject: `Reset your ${ctx.businessName} password`,
        html: layout(content, b),
        text: `Password reset requested for ${ctx.businessName}. Use the link in the app to continue.`,
      };
    }
    case "staff.invitation": {
      const content = `
        <p style="margin:0 0 16px;">Hi ${ctx.customerName || "there"},</p>
        <p>You've been invited to join ${ctx.businessName} as a team member on ${BRAND_NAME}.</p>
        <p>Open your invitation from the dashboard to accept.</p>`;
      return {
        key,
        subject: `You're invited to ${ctx.businessName}`,
        html: layout(content, b),
        text: `You've been invited to join ${ctx.businessName} on ${BRAND_NAME}.`,
      };
    }
    case "business.invitation": {
      const content = `
        <p style="margin:0 0 16px;">Hi ${ctx.customerName || "there"},</p>
        <p>You've been invited to manage ${ctx.businessName} on ${BRAND_NAME}.</p>`;
      return {
        key,
        subject: `Business invitation — ${ctx.businessName}`,
        html: layout(content, b),
        text: `You've been invited to manage ${ctx.businessName} on ${BRAND_NAME}.`,
      };
    }
    case "marketing.campaign": {
      const body = ctx.customMessage || "We have something special for you.";
      const content = `
        <p style="margin:0 0 16px;">Hi ${ctx.customerName},</p>
        <p>${body}</p>
        <p style="margin-top:24px;font-size:12px;color:#64748b;">You received this because you opted in to marketing from ${ctx.businessName}.</p>`;
      return {
        key,
        subject: ctx.notes || `News from ${ctx.businessName}`,
        html: layout(content, b),
        text: body,
      };
    }
    case "appointment.staff": {
      const action = ctx.customMessage || "updated";
      const content = `
        <p style="margin:0 0 16px;">Hi ${ctx.staffName},</p>
        <p>Appointment ${action}:</p>
        ${appointmentDetails(ctx)}`;
      return {
        key,
        subject: `Staff: appointment ${action}`,
        html: layout(content, b),
        text: `Appointment ${action}: ${ctx.serviceName} with ${ctx.customerName} on ${whenLabel(ctx.startTime)}.`,
      };
    }
    case "appointment.business": {
      const action = ctx.customMessage || "Updated";
      const content = `
        <p style="margin:0 0 16px;">${action}</p>
        ${appointmentDetails(ctx)}`;
      return {
        key,
        subject: `${action}: ${ctx.serviceName}`,
        html: layout(content, b),
        text: `${action}: ${ctx.serviceName} — ${ctx.customerName} on ${whenLabel(ctx.startTime)}.`,
      };
    }
    default: {
      const body = ctx.customMessage || "Message from " + ctx.businessName;
      return {
        key: "custom",
        subject: ctx.notes || ctx.businessName,
        html: layout(`<p>${body}</p>`, b),
        text: body,
      };
    }
  }
}

export function renderSmsTemplate(
  key: string,
  ctx: AppointmentTemplateContext,
): RenderedTemplate {
  const when = whenLabel(ctx.startTime);
  switch (key) {
    case "appointment.confirmation":
      return {
        key,
        text: `${ctx.businessName}: Confirmed ${ctx.serviceName} with ${ctx.staffName} on ${when}.`,
      };
    case "appointment.reminder":
      return {
        key,
        text: `${ctx.businessName} reminder: ${ctx.serviceName} with ${ctx.staffName} on ${when}.`,
      };
    case "appointment.cancellation":
      return {
        key,
        text: `${ctx.businessName}: Your ${ctx.serviceName} on ${when} was cancelled.`,
      };
    case "appointment.reschedule":
      return {
        key,
        text: `${ctx.businessName}: ${ctx.serviceName} rescheduled to ${when}.`,
      };
    case "commerce.deposit_reminder":
      return {
        key,
        text: `${ctx.businessName}: Deposit of ${money(ctx.amountCents)} is due for ${ctx.serviceName} on ${when}.`,
      };
    case "appointment.late_arrival":
      return {
        key,
        text: `${ctx.businessName}: Running late? Reply or call us — your ${ctx.serviceName} is booked for ${when}.`,
      };
    default:
      return {
        key: "custom",
        text:
          ctx.customMessage ||
          `${ctx.businessName}: ${ctx.serviceName} on ${when}.`,
      };
  }
}

export function previewTemplate(
  channel: "email" | "sms",
  key: string,
  ctx: AppointmentTemplateContext,
): RenderedTemplate {
  return channel === "email"
    ? renderEmailTemplate(key, ctx)
    : renderSmsTemplate(key, ctx);
}
