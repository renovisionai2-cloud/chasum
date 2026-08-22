import { formatDocumentEmailMoney } from "@/lib/commerce/document-currency";
import { currencyCode, formatMoneyCentsExact } from "@/lib/commerce/money";
import { getAppUrl } from "@/lib/env";
import { BRAND_NAME } from "@/lib/brand/assets";
import {
  formatAppointmentEmailDate,
  formatAppointmentEmailMonthDay,
  formatAppointmentEmailTimeRange,
  formatAppointmentEmailWhen,
  resolveAppointmentEmailTimezone,
} from "@/lib/communications/appointment-datetime";
import type {
  AppointmentTemplateContext,
  BrandingContext,
  RenderedTemplate,
} from "@/lib/communications/types";

function money(
  cents: number | null | undefined,
  currency?: string | null,
): string {
  if (cents == null) return "";
  return formatMoneyCentsExact(cents, currency);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brand(ctx: AppointmentTemplateContext): BrandingContext {
  return (
    ctx.branding ?? {
      businessName: ctx.businessName,
      logoUrl: null,
      optOutFooter: null,
      showChasumBranding: true,
      chasumBrandingStyle: "powered_by",
    }
  );
}

function ctxTimezone(ctx: AppointmentTemplateContext): string {
  return resolveAppointmentEmailTimezone({
    locationTimezone: ctx.locationTimezone,
    businessTimezone: ctx.businessTimezone,
    timezone: ctx.timezone,
  });
}

function safeColor(raw: string | null | undefined, fallback: string): string {
  const value = (raw ?? "").trim();
  if (/^#[0-9A-Fa-f]{3,8}$/.test(value)) return value;
  if (/^[a-zA-Z]+$/.test(value)) return value;
  return fallback;
}

function headerIdentity(branding: BrandingContext, color: string): string {
  const name = escapeHtml(branding.businessName);
  const logo = branding.logoUrl?.trim();
  if (logo) {
    return `
      <img src="${escapeHtml(logo)}" alt="${name}" width="200"
        style="display:block;border:0;outline:none;text-decoration:none;max-width:200px;width:auto;height:auto;max-height:72px;" />
      <p style="margin:14px 0 0;font-size:18px;font-weight:600;color:${color};font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">${name}</p>`;
  }
  return `<p style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:${color};font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">${name}</p>`;
}

function isPlatformNotifyAddress(email: string): boolean {
  return /notifications@chasumai\.com/i.test(email.trim());
}

/** Customer-facing contact email — never the platform technical sender. */
function resolveCustomerContactEmail(
  branding: BrandingContext,
): string | null {
  const email = branding.supportEmail?.trim();
  if (!email) return null;
  if (isPlatformNotifyAddress(email)) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function appointmentMailtoHref(
  email: string,
  ctx: AppointmentTemplateContext,
): string {
  const dateLabel = formatAppointmentEmailDate(ctx.startTime, ctxTimezone(ctx));
  const subject = `Appointment question — ${ctx.serviceName} — ${dateLabel}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Primary customer contact CTA with appointment-specific mailto subject.
 */
function appointmentContactCta(
  branding: BrandingContext,
  ctx: AppointmentTemplateContext,
): string {
  const businessName = escapeHtml(branding.businessName);
  const email = resolveCustomerContactEmail(branding);
  const accent = safeColor(branding.primaryColor, "#0b1324");

  if (!email) {
    return `
      <div style="margin:24px 0 0;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
        <p style="margin:0;font-size:14px;line-height:1.5;color:#334155;">
          Need to change or cancel? Contact <strong>${businessName}</strong> and we’ll help.
        </p>
      </div>`;
  }

  const href = appointmentMailtoHref(email, ctx);
  return `
    <div style="margin:24px 0 0;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
      <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#334155;">
        Need to change or cancel? Email <strong>${businessName}</strong> — or use Reply in your mail app.
      </p>
      <a href="${escapeHtml(href)}"
         style="${emailCtaStyle(accent)}">
        Email ${businessName}
      </a>
      <p style="margin:12px 0 0;font-size:12px;color:#64748b;word-break:break-all;">
        ${escapeHtml(email)}
      </p>
    </div>`;
}

function contactBlock(
  branding: BrandingContext,
  ctx?: AppointmentTemplateContext,
): string {
  const businessName = escapeHtml(branding.businessName);
  const lines: string[] = [];
  const email = resolveCustomerContactEmail(branding);
  const phone = branding.supportPhone?.trim();
  const website = branding.websiteUrl?.trim();
  const accent = safeColor(branding.primaryColor, "#0b1324");

  if (email) {
    const href = ctx
      ? appointmentMailtoHref(email, ctx)
      : `mailto:${email}`;
    lines.push(
      `<p style="margin:0 0 10px;"><a href="${escapeHtml(href)}" style="${emailCtaStyle(accent)}">Email ${businessName}</a></p>`,
    );
  }
  if (phone) {
    const tel = phone.replace(/[^\d+]/g, "");
    lines.push(
      `<p style="margin:0 0 8px;font-size:14px;"><a href="tel:${escapeHtml(tel)}" style="color:#0f172a;text-decoration:underline;">Call ${businessName}</a> · ${escapeHtml(phone)}</p>`,
    );
  }
  if (website) {
    const href = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    lines.push(
      `<p style="margin:0 0 8px;font-size:14px;"><a href="${escapeHtml(href)}" style="color:#0f172a;text-decoration:underline;">Visit website</a></p>`,
    );
  }
  if (!lines.length) return "";
  return `
    <div style="margin:28px 0 0;padding:18px 0 0;border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">Need help with your appointment?</p>
      <p style="margin:0 0 14px;font-size:15px;color:#0f172a;font-weight:500;">Contact ${businessName}</p>
      ${lines.join("")}
    </div>`;
}

function staffAppointmentCopy(ctx: AppointmentTemplateContext): {
  subject: string;
  intro: string;
} {
  const customer = (ctx.customerName || "customer").trim();
  const action = String(ctx.customMessage ?? "").trim().toLowerCase();
  if (
    !action ||
    action === "new appointment" ||
    action.includes("new appointment") ||
    action === "created" ||
    action === "confirmed"
  ) {
    return {
      subject: `New appointment — ${customer}`,
      intro: "A new appointment has been booked.",
    };
  }
  if (action.includes("cancel")) {
    return {
      subject: `Appointment cancelled — ${customer}`,
      intro: "An appointment has been cancelled.",
    };
  }
  if (action.includes("reschedule")) {
    return {
      subject: `Appointment rescheduled — ${customer}`,
      intro: "An appointment has been rescheduled.",
    };
  }
  return {
    subject: `Appointment update — ${customer}`,
    intro: "An appointment has been updated.",
  };
}

function financialBlock(
  ctx: AppointmentTemplateContext,
  audience: "customer" | "business",
): string {
  const total =
    ctx.appointmentTotalCents ??
    ctx.amountCents ??
    (ctx.subtotalCents != null
      ? Number(ctx.subtotalCents) + Number(ctx.taxCents ?? 0)
      : null);
  if (total == null) return "";

  const subtotal = ctx.subtotalCents;
  const tax = ctx.taxCents;
  const depositRequired = Math.max(0, Number(ctx.depositRequiredCents ?? 0));
  const depositPaid = Math.max(0, Number(ctx.depositPaidCents ?? 0));
  // Prefer shared resolver value; fall back only when older callers omit it.
  const depositDueNow =
    ctx.depositDueNowCents != null
      ? Math.max(0, Math.round(Number(ctx.depositDueNowCents)))
      : Math.max(0, depositRequired - Math.min(depositRequired, depositPaid));
  const remaining =
    ctx.remainingBalanceCents != null
      ? Math.max(0, Number(ctx.remainingBalanceCents))
      : Math.max(0, total - depositPaid);

  const rows: string[] = [];
  if (subtotal != null) {
    rows.push(
      detailRow("Subtotal", money(subtotal)),
    );
  }
  if (tax != null && tax > 0) {
    const rateBps = Math.max(0, Number(ctx.taxRateBps ?? 0));
    const label = (ctx.taxLabel ?? "Tax").trim() || "Tax";
    const taxHeading =
      rateBps > 0
        ? `${label} (${(rateBps / 100).toFixed(rateBps % 100 === 0 ? 0 : 2)}%)`
        : label;
    rows.push(detailRow(taxHeading, money(tax)));
  }
  rows.push(detailRow("Appointment total", `<strong>${money(total)}</strong>`));

  if (audience === "business" && depositRequired > 0) {
    // Always pair configured requirement with current payment state.
    rows.push(detailRow("Deposit required", money(depositRequired)));
    rows.push(detailRow("Deposit received", money(depositPaid)));
    rows.push(detailRow("Deposit due now", money(depositDueNow)));
    if (ctx.paymentStatusLabel) {
      rows.push(detailRow("Payment status", escapeHtml(ctx.paymentStatusLabel)));
    }
    if (depositPaid > 0 && ctx.paymentMethodLabel) {
      rows.push(detailRow("Deposit method", escapeHtml(ctx.paymentMethodLabel)));
    }
  } else {
    if (depositRequired > 0) {
      rows.push(detailRow("Deposit required", money(depositRequired)));
    }
    if (depositPaid > 0) {
      rows.push(detailRow("Deposit paid", money(depositPaid)));
      if (ctx.paymentMethodLabel) {
        rows.push(
          detailRow("Payment method", escapeHtml(ctx.paymentMethodLabel)),
        );
      }
    } else if (depositRequired > 0) {
      rows.push(detailRow("Deposit paid", money(0)));
    }
  }

  rows.push(
    detailRow("Balance remaining", `<strong>${money(remaining)}</strong>`),
  );

  let message = "";
  if (audience === "customer") {
    if (depositPaid <= 0) {
      message =
        '<p style="margin:0 0 12px;color:#475569;font-size:14px;">Your appointment is confirmed. No payment was recorded at the time of booking.</p>';
    } else if (remaining <= 0) {
      message = `<p style="margin:0 0 12px;color:#475569;font-size:14px;">Your appointment is confirmed and paid in full.</p>`;
    } else {
      message = `<p style="margin:0 0 12px;color:#475569;font-size:14px;">Your appointment is confirmed and your ${money(depositPaid)} deposit was received.</p>`;
    }
  }

  return `
    ${message}
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0 0;">${rows.join("")}</table>`;
}

function footerHtml(branding: BrandingContext): string {
  const custom = branding.optOutFooter?.trim();
  if (branding.showChasumBranding === false) {
    // Entitled customer emails never show platform Powered-by copy.
    if (
      custom &&
      !/powered by chasum|sent by chasum|sent via chasum|chasum ·/i.test(custom)
    ) {
      return escapeHtml(custom);
    }
    return escapeHtml(branding.businessName);
  }
  if (branding.chasumBrandingStyle === "product_context") {
    const product = custom || `Sent via ${BRAND_NAME}`;
    if (/powered by chasum/i.test(product)) {
      return escapeHtml(`Sent via ${BRAND_NAME}`);
    }
    return escapeHtml(product);
  }
  // Free plan / default: secondary Powered by — never the old platform tagline.
  if (custom && !/sent by chasum|powered by chasum|sent via chasum/i.test(custom)) {
    return `${escapeHtml(custom)}<br/><span style="color:#94a3b8;">Powered by ${escapeHtml(BRAND_NAME)}</span>`;
  }
  return `Powered by ${escapeHtml(BRAND_NAME)}`;
}

function layout(
  content: string,
  branding: BrandingContext,
  options?: { headline?: string; accent?: string | null },
): string {
  const color = safeColor(
    options?.accent || branding.primaryColor,
    "#0b1324",
  );
  const headline = options?.headline
    ? `<h1 style="margin:20px 0 0;font-size:22px;font-weight:600;color:#0f172a;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">${escapeHtml(options.headline)}</h1>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(branding.businessName)}</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .email-pad { padding-left: 16px !important; padding-right: 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 8px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td class="email-pad" style="padding:24px 20px 12px;border-top:4px solid ${color};">
          ${headerIdentity(branding, color)}
          ${headline}
        </td></tr>
        <tr><td class="email-pad" style="padding:8px 20px 24px;color:#334155;font-size:15px;line-height:1.55;word-break:break-word;">
          ${content}
        </td></tr>
        <tr><td class="email-pad" style="padding:14px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#64748b;word-break:break-word;">
          ${footerHtml(branding)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function whenLabel(ctx: AppointmentTemplateContext): string {
  return formatAppointmentEmailWhen(
    ctx.startTime,
    ctxTimezone(ctx),
    ctx.endTime,
  );
}

function dateTimeBlock(ctx: AppointmentTemplateContext): string {
  const zone = ctxTimezone(ctx);
  const dateLine = formatAppointmentEmailDate(ctx.startTime, zone);
  const timeLine = formatAppointmentEmailTimeRange(
    ctx.startTime,
    ctx.endTime,
    zone,
  );
  return `${escapeHtml(dateLine)}<br/>${escapeHtml(timeLine)}`;
}

function emailCtaStyle(accent: string): string {
  return `display:block;width:100%;max-width:100%;box-sizing:border-box;background:${accent};color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:15px;font-weight:600;min-height:44px;line-height:20px;text-align:center;`;
}

function detailRow(label: string, valueHtml: string): string {
  if (!valueHtml?.trim()) return "";
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
      <div style="color:#64748b;font-size:12px;line-height:1.4;padding-bottom:3px;word-break:break-word;">${escapeHtml(label)}</div>
      <div style="font-weight:500;color:#0f172a;font-size:15px;line-height:1.45;word-break:break-word;">${valueHtml}</div>
    </td>
  </tr>`;
}

function appointmentDetails(ctx: AppointmentTemplateContext): string {
  const location =
    (ctx as AppointmentTemplateContext & { locationName?: string | null })
      .locationName?.trim() || null;
  const rows = [
    detailRow("Service", escapeHtml(ctx.serviceName)),
    detailRow("Provider", escapeHtml(ctx.staffName)),
    detailRow("Date and time", dateTimeBlock(ctx)),
    location ? detailRow("Location", escapeHtml(location)) : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName)},</p>
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0;">${rows}</table>`;
}

function appointmentDetailsBusiness(ctx: AppointmentTemplateContext): string {
  const location =
    (ctx as AppointmentTemplateContext & { locationName?: string | null })
      .locationName?.trim() || null;
  const rows = [
    detailRow("Customer", escapeHtml(ctx.customerName)),
    detailRow("Service", escapeHtml(ctx.serviceName)),
    detailRow("Employee", escapeHtml(ctx.staffName)),
    detailRow("Date and time", dateTimeBlock(ctx)),
    location ? detailRow("Location", escapeHtml(location)) : "",
    detailRow("Booking source", "Reception"),
  ]
    .filter(Boolean)
    .join("");
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0;">${rows}</table>`;
}

/** Staff-facing appointment facts — never a second customer greeting. */
function appointmentDetailsStaff(ctx: AppointmentTemplateContext): string {
  const location =
    (ctx as AppointmentTemplateContext & { locationName?: string | null })
      .locationName?.trim() || null;
  const rows = [
    detailRow("Customer", escapeHtml(ctx.customerName)),
    detailRow("Service", escapeHtml(ctx.serviceName)),
    detailRow("Employee", escapeHtml(ctx.staffName)),
    detailRow("Date and time", dateTimeBlock(ctx)),
    location ? detailRow("Location", escapeHtml(location)) : "",
  ]
    .filter(Boolean)
    .join("");
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0;">${rows}</table>`;
}

export function renderEmailTemplate(
  key: string,
  ctx: AppointmentTemplateContext,
): RenderedTemplate {
  const b = brand(ctx);
  const monthDay = formatAppointmentEmailMonthDay(ctx.startTime, ctxTimezone(ctx));

  switch (key) {
    case "appointment.confirmation": {
      const content = `
        <p style="margin:0 0 4px;color:#475569;font-size:14px;">Your appointment is confirmed.</p>
        ${appointmentDetails(ctx)}
        ${financialBlock(ctx, "customer")}
        ${appointmentContactCta(b, ctx)}`;
      const total =
        ctx.appointmentTotalCents ?? ctx.amountCents ?? null;
      return {
        key,
        subject: `You're booked — ${ctx.serviceName} on ${monthDay}`,
        html: layout(content, b, { headline: "Appointment confirmed" }),
        text: [
          `${ctx.businessName}`,
          ``,
          `Appointment confirmed`,
          ``,
          `Hi ${ctx.customerName},`,
          `Your appointment is confirmed.`,
          ``,
          `Service: ${ctx.serviceName}`,
          `Provider: ${ctx.staffName}`,
          `When: ${whenLabel(ctx)}`,
          total != null ? `Appointment total: ${money(total)}` : "",
          ctx.depositPaidCents
            ? `Deposit paid: ${money(ctx.depositPaidCents)}`
            : ctx.depositRequiredCents
              ? `Deposit required: ${money(ctx.depositRequiredCents)} (not paid)`
              : "",
          ctx.remainingBalanceCents != null
            ? `Balance remaining: ${money(ctx.remainingBalanceCents)}`
            : "",
          ``,
          b.supportEmail && !isPlatformNotifyAddress(b.supportEmail)
            ? `Email ${ctx.businessName}: ${b.supportEmail}`
            : `Contact ${ctx.businessName} to change or cancel.`,
          b.showChasumBranding === true &&
          b.chasumBrandingStyle !== "none"
            ? `Powered by ${BRAND_NAME}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }
    case "appointment.reminder": {
      const content = `${appointmentDetails(ctx)}
        <p style="margin:16px 0 0;">Just a friendly reminder — we can’t wait to see you.</p>
        ${contactBlock(b, ctx)}`;
      return {
        key,
        subject: `Reminder: ${ctx.serviceName} with ${ctx.businessName}`,
        html: layout(content, b, { headline: "Appointment reminder" }),
        text: `Reminder: ${ctx.serviceName} with ${ctx.staffName} on ${whenLabel(ctx)}.`,
      };
    }
    case "appointment.reschedule": {
      const prev = ctx.previousStartTime
        ? `<p style="margin:8px 0 0;color:#64748b;font-size:14px;">Previously: ${escapeHtml(formatAppointmentEmailWhen(ctx.previousStartTime, ctxTimezone(ctx)))}</p>`
        : "";
      const content = `${appointmentDetails(ctx)}${prev}
        <p style="margin:16px 0 0;">Your appointment has a new time. See you then.</p>
        ${contactBlock(b, ctx)}`;
      return {
        key,
        subject: `Updated time — ${ctx.serviceName} · ${ctx.businessName}`,
        html: layout(content, b, { headline: "Appointment updated" }),
        text: `Your ${ctx.serviceName} appointment is now ${whenLabel(ctx)}.`,
      };
    }
    case "appointment.cancellation": {
      const content = `${appointmentDetails(ctx)}
        <p style="margin:16px 0 0;">This confirms your appointment has been cancelled. This message is not a payment or refund notice.</p>
        <p style="margin:12px 0 0;">Reply anytime if you’d like to rebook — we’d love to have you back.</p>
        ${contactBlock(b, ctx)}`;
      return {
        key,
        subject: `Cancelled — ${ctx.serviceName} on ${monthDay}`,
        html: layout(content, b, { headline: "Appointment cancelled" }),
        text: `Your ${ctx.serviceName} on ${whenLabel(ctx)} with ${ctx.businessName} has been cancelled. This is not a payment or refund notice.`,
      };
    }
    case "commerce.invoice": {
      const cur = ctx.documentCurrency;
      const docMoney = (cents: number | null | undefined) =>
        cents == null ? "" : formatDocumentEmailMoney(cents, cur ?? "usd");
      const content = `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName)},</p>
        <p>Invoice ${escapeHtml(ctx.invoiceNumber ?? "")} from <strong>${escapeHtml(ctx.businessName)}</strong> is ready.</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin:12px 0;">
          ${ctx.serviceName ? detailRow("Service", escapeHtml(ctx.serviceName)) : ""}
          ${ctx.invoiceIssueDate ? detailRow("Issued", escapeHtml(ctx.invoiceIssueDate)) : ""}
          ${ctx.invoiceDueDate ? detailRow("Due", escapeHtml(ctx.invoiceDueDate)) : ""}
          ${cur ? detailRow("Currency", escapeHtml(currencyCode(cur))) : ""}
          ${ctx.subtotalCents != null ? detailRow("Subtotal", docMoney(ctx.subtotalCents)) : ""}
          ${ctx.taxCents != null && ctx.taxCents > 0 ? detailRow("Tax", docMoney(ctx.taxCents)) : ""}
          ${detailRow("Invoice total", `<strong>${docMoney(ctx.appointmentTotalCents ?? ctx.amountCents)}</strong>`)}
          ${ctx.invoicePaidCents != null ? detailRow("Paid", docMoney(ctx.invoicePaidCents)) : ""}
          ${ctx.invoiceBalanceCents != null ? detailRow("Balance", docMoney(ctx.invoiceBalanceCents)) : ""}
        </table>
        <p style="margin:0;color:#475569;font-size:14px;">Questions? Reply to this email or contact ${escapeHtml(ctx.businessName)} directly.</p>
        ${contactBlock(b, ctx)}`;
      return {
        key,
        subject: `Invoice ${ctx.invoiceNumber ?? ""} from ${ctx.businessName}`,
        html: layout(content, b, { headline: "Invoice" }),
        text: [
          `Invoice ${ctx.invoiceNumber ?? ""} from ${ctx.businessName}.`,
          cur ? `Currency: ${currencyCode(cur)}` : null,
          ctx.subtotalCents != null ? `Subtotal: ${docMoney(ctx.subtotalCents)}` : null,
          ctx.taxCents != null ? `Tax: ${docMoney(ctx.taxCents)}` : null,
          `Total: ${docMoney(ctx.appointmentTotalCents ?? ctx.amountCents)}`,
          ctx.invoicePaidCents != null ? `Paid: ${docMoney(ctx.invoicePaidCents)}` : null,
          ctx.invoiceBalanceCents != null ? `Balance: ${docMoney(ctx.invoiceBalanceCents)}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }
    case "commerce.receipt": {
      const total =
        ctx.appointmentTotalCents ??
        (ctx.subtotalCents != null
          ? Number(ctx.subtotalCents) + Number(ctx.taxCents ?? 0)
          : ctx.amountCents ?? null);
      const paid = ctx.depositPaidCents ?? ctx.amountCents ?? null;
      const remaining = ctx.remainingBalanceCents;
      const subtotal = ctx.subtotalCents;
      const tax = ctx.taxCents;
      const rateBps = Math.max(0, Number(ctx.taxRateBps ?? 0));
      const taxHeading =
        tax != null && tax > 0
          ? rateBps > 0
            ? `${(ctx.taxLabel ?? "Tax").trim() || "Tax"} (${(rateBps / 100).toFixed(rateBps % 100 === 0 ? 0 : 2)}%)`
            : (ctx.taxLabel ?? "Tax").trim() || "Tax"
          : null;
      const supportEmail = resolveCustomerContactEmail(b);
      const content = `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName)},</p>
        <p>Thank you — payment received. Here’s your receipt ${escapeHtml(ctx.receiptNumber ?? "")}.</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin:12px 0;">
          ${detailRow("Service", escapeHtml(ctx.serviceName))}
          ${ctx.startTime ? detailRow("Appointment", escapeHtml(whenLabel(ctx))) : ""}
          ${subtotal != null ? detailRow("Subtotal", money(subtotal)) : ""}
          ${taxHeading && tax != null && tax > 0 ? detailRow(taxHeading, money(tax)) : ""}
          ${total != null ? detailRow("Appointment total", `<strong>${money(total)}</strong>`) : ""}
          ${detailRow("Amount received", `<strong>${money(ctx.amountCents)}</strong>`)}
          ${ctx.paymentMethodLabel ? detailRow("Payment method", escapeHtml(ctx.paymentMethodLabel)) : ""}
          ${paid != null ? detailRow("Total paid", money(paid)) : ""}
          ${remaining != null ? detailRow("Balance remaining", money(remaining)) : ""}
          ${ctx.paymentStatusLabel ? detailRow("Payment status", escapeHtml(ctx.paymentStatusLabel)) : ""}
          ${ctx.receiptNumber ? detailRow("Receipt", escapeHtml(ctx.receiptNumber)) : ""}
        </table>
        <p style="margin:16px 0 0;color:#475569;font-size:14px;">We appreciate your business.</p>
        ${appointmentContactCta(b, ctx)}`;
      const amountLabel = money(ctx.amountCents);
      const textLines = [
        `Receipt ${ctx.receiptNumber ?? ""} for ${amountLabel} from ${ctx.businessName}.`,
        `Service: ${ctx.serviceName}`,
        subtotal != null ? `Subtotal: ${money(subtotal)}` : null,
        tax != null && tax > 0 ? `${taxHeading}: ${money(tax)}` : null,
        total != null ? `Appointment total: ${money(total)}` : null,
        `Amount received: ${amountLabel}`,
        paid != null ? `Total paid: ${money(paid)}` : null,
        remaining != null ? `Balance remaining: ${money(remaining)}` : null,
        supportEmail ? `Contact: ${supportEmail}` : null,
        "Thank you!",
      ].filter(Boolean);
      return {
        key,
        subject: `Payment receipt — ${amountLabel} for ${ctx.serviceName}`,
        html: layout(content, b, { headline: "Payment receipt" }),
        text: textLines.join("\n"),
      };
    }
    case "commerce.refund": {
      const cur = ctx.documentCurrency;
      const refundAmount = ctx.amountCents ?? 0;
      const refundLabel = money(refundAmount, cur);
      const refundType = (ctx.refundTypeLabel ?? "Refund").trim() || "Refund";
      const isPartial = /partial/i.test(refundType);
      const original = ctx.originalPaymentCents;
      const previously = ctx.previouslyRefundedCents;
      const remaining = ctx.remainingRefundableCents;
      const intro = isPartial
        ? `A partial refund of <strong>${refundLabel}</strong> has been processed successfully.`
        : `Your refund of <strong>${refundLabel}</strong> has been processed successfully.`;
      const tenderNote =
        ctx.refundTenderNote?.trim() ||
        "This refund has been recorded by the business.";
      const content = `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName)},</p>
        <p style="margin:0 0 12px;">${intro}</p>
        <p style="margin:0 0 16px;color:#475569;font-size:14px;">${escapeHtml(tenderNote)}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin:12px 0;">
          ${detailRow("Refund type", escapeHtml(refundType))}
          ${detailRow("Refund amount", `<strong>${refundLabel}</strong>`)}
          ${original != null ? detailRow("Original payment", money(original, cur)) : ""}
          ${previously != null && previously > 0 ? detailRow("Previously refunded", money(previously, cur)) : ""}
          ${remaining != null ? detailRow("Remaining refundable", money(remaining, cur)) : ""}
          ${ctx.paymentMethodLabel ? detailRow("Payment method", escapeHtml(ctx.paymentMethodLabel)) : ""}
          ${ctx.refundDateLabel ? detailRow("Refund date", escapeHtml(ctx.refundDateLabel)) : ""}
          ${ctx.serviceName && ctx.serviceName !== "Payment" ? detailRow("Service", escapeHtml(ctx.serviceName)) : ""}
          ${ctx.startTime ? detailRow("Appointment", escapeHtml(whenLabel(ctx))) : ""}
          ${ctx.invoiceNumber ? detailRow("Invoice", escapeHtml(ctx.invoiceNumber)) : ""}
          ${ctx.receiptNumber ? detailRow("Receipt", escapeHtml(ctx.receiptNumber)) : ""}
        </table>
        <p style="margin:16px 0 0;color:#475569;font-size:14px;">If you have questions about this refund, reply to this email or contact ${escapeHtml(ctx.businessName)}.</p>
        ${appointmentContactCta(b, ctx)}`;
      const textLines = [
        `Refund confirmation from ${ctx.businessName}.`,
        `${refundType}: ${refundLabel}`,
        original != null ? `Original payment: ${money(original, cur)}` : null,
        previously != null && previously > 0
          ? `Previously refunded: ${money(previously, cur)}`
          : null,
        remaining != null ? `Remaining refundable: ${money(remaining, cur)}` : null,
        ctx.paymentMethodLabel
          ? `Payment method: ${ctx.paymentMethodLabel}`
          : null,
        tenderNote,
      ].filter(Boolean);
      return {
        key,
        subject: `Refund confirmation — ${ctx.businessName}`,
        html: layout(content, b, { headline: "Refund confirmation" }),
        text: textLines.join("\n"),
      };
    }
    case "commerce.refund.business": {
      const cur = ctx.documentCurrency;
      const refundAmount = ctx.amountCents ?? 0;
      const refundLabel = money(refundAmount, cur);
      const refundType = (ctx.refundTypeLabel ?? "Refund").trim() || "Refund";
      const original = ctx.originalPaymentCents;
      const previously = ctx.previouslyRefundedCents;
      const remaining = ctx.remainingRefundableCents;
      const openUrl =
        ctx.actionUrl?.trim() || `${getAppUrl()}/dashboard/payments`;
      const content = `
        <p style="margin:0 0 16px;">A refund was processed.</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin:12px 0;">
          ${detailRow("Customer", escapeHtml(ctx.customerName))}
          ${ctx.serviceName ? detailRow("Service", escapeHtml(ctx.serviceName)) : ""}
          ${ctx.startTime ? detailRow("Appointment", escapeHtml(whenLabel(ctx))) : ""}
          ${ctx.locationName ? detailRow("Location", escapeHtml(ctx.locationName)) : ""}
          ${detailRow("Refund type", escapeHtml(refundType))}
          ${detailRow("Refund amount", `<strong>${refundLabel}</strong>`)}
          ${cur ? detailRow("Currency", escapeHtml(currencyCode(cur))) : ""}
          ${original != null ? detailRow("Original payment", money(original, cur)) : ""}
          ${ctx.paymentMethodLabel ? detailRow("Payment method", escapeHtml(ctx.paymentMethodLabel)) : ""}
          ${previously != null ? detailRow("Previously refunded", money(previously, cur)) : ""}
          ${remaining != null ? detailRow("Remaining refundable", money(remaining, cur)) : ""}
          ${ctx.invoiceNumber ? detailRow("Invoice", escapeHtml(ctx.invoiceNumber)) : ""}
          ${ctx.receiptNumber ? detailRow("Receipt", escapeHtml(ctx.receiptNumber)) : ""}
          ${ctx.refundReason ? detailRow("Reason", escapeHtml(ctx.refundReason)) : ""}
          ${ctx.processedByName ? detailRow("Processed by", escapeHtml(ctx.processedByName)) : ""}
          ${ctx.processedAtLabel ? detailRow("Processed", escapeHtml(ctx.processedAtLabel)) : ""}
        </table>
        <p style="margin:24px 0 0;">
          <a href="${escapeHtml(openUrl)}" style="${emailCtaStyle("#0b1324")}">
            Open in ${escapeHtml(BRAND_NAME)}
          </a>
        </p>`;
      return {
        key,
        subject: `Refund processed — ${ctx.customerName} · ${refundLabel}`,
        html: layout(content, b, { headline: "Refund processed" }),
        text: [
          `Refund processed for ${ctx.customerName}.`,
          `${refundType}: ${refundLabel}`,
          ctx.refundReason ? `Reason: ${ctx.refundReason}` : null,
          `Open ${openUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }
    case "commerce.gift_certificate": {
      const code = ctx.invoiceNumber ?? "GIFT";
      const content = `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName || "there")},</p>
        <p style="margin:0 0 12px;">${ctx.staffName && ctx.staffName !== "Team" ? `<strong>${escapeHtml(ctx.staffName)}</strong> sent you` : "You’ve received"} a gift certificate from <strong>${escapeHtml(ctx.businessName)}</strong>.</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.08em;margin:24px 0 8px;font-family:ui-monospace,monospace;color:#0f172a;">${escapeHtml(code)}</p>
        <p style="font-size:18px;font-weight:600;margin:0 0 16px;">Value ${money(ctx.amountCents)}</p>
        <p style="margin:0 0 8px;color:#475569;font-size:14px;">Save this email — present the code when you redeem in-store or online.</p>
        ${
          ctx.customMessage
            ? `<div style="white-space:pre-wrap;font-size:14px;line-height:1.5;background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;margin:16px 0 0;color:#334155;">${escapeHtml(ctx.customMessage)}</div>`
            : ""
        }
        ${contactBlock(b, ctx)}`;
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
        <p style="margin:16px 0 0;">A deposit of <strong>${money(ctx.amountCents)}</strong> holds your appointment. Pay at your convenience — we’ll confirm once it’s received.</p>
        ${contactBlock(b, ctx)}`;
      return {
        key,
        subject: `Deposit to hold your ${ctx.serviceName}`,
        html: layout(content, b, { headline: "Deposit requested" }),
        text: `Deposit of ${money(ctx.amountCents)} requested for ${ctx.serviceName} on ${whenLabel(ctx)}.`,
      };
    }
    case "auth.welcome": {
      const content = `
        <p style="margin:0 0 16px;">Welcome to ${escapeHtml(ctx.businessName)}!</p>
        <p>Your account is ready. Book online anytime and manage your visits from one place.</p>
        ${contactBlock(b, ctx)}`;
      return {
        key,
        subject: `Welcome to ${ctx.businessName}`,
        html: layout(content, b),
        text: `Welcome to ${ctx.businessName}! Your account is ready.`,
      };
    }
    case "auth.password_reset": {
      const content = `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName || "there")},</p>
        <p>A password reset was requested for your ${escapeHtml(ctx.businessName)} account. Use your secure reset link from the app to continue.</p>
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
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName || "there")},</p>
        <p>You’ve been invited to join ${escapeHtml(ctx.businessName)} as a team member on ${escapeHtml(BRAND_NAME)}.</p>
        <p>Open your invitation from the dashboard to accept.</p>`;
      return {
        key,
        subject: `You’re invited to ${ctx.businessName}`,
        html: layout(content, b),
        text: `You’ve been invited to join ${ctx.businessName} on ${BRAND_NAME}.`,
      };
    }
    case "business.invitation": {
      const content = `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName || "there")},</p>
        <p>You’ve been invited to manage ${escapeHtml(ctx.businessName)} on ${escapeHtml(BRAND_NAME)}.</p>`;
      return {
        key,
        subject: `Business invitation — ${ctx.businessName}`,
        html: layout(content, b),
        text: `You’ve been invited to manage ${ctx.businessName} on ${BRAND_NAME}.`,
      };
    }
    case "marketing.campaign": {
      const body = ctx.customMessage || "We have something special for you.";
      const content = `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.customerName)},</p>
        <p>${escapeHtml(body)}</p>
        <p style="margin-top:24px;font-size:12px;color:#64748b;">You received this because you opted in to marketing from ${escapeHtml(ctx.businessName)}.</p>
        ${contactBlock(b, ctx)}`;
      return {
        key,
        subject: ctx.notes || `News from ${ctx.businessName}`,
        html: layout(content, b),
        text: body,
      };
    }
    case "appointment.staff": {
      const copy = staffAppointmentCopy(ctx);
      const content = `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.staffName)},</p>
        <p>${escapeHtml(copy.intro)}</p>
        ${appointmentDetailsStaff(ctx)}
        ${financialBlock(ctx, "business")}`;
      return {
        key,
        subject: copy.subject,
        html: layout(content, b),
        text: `${copy.intro} ${ctx.serviceName} with ${ctx.customerName} on ${whenLabel(ctx)}.`,
      };
    }
    case "appointment.business": {
      const openUrl = `${getAppUrl()}/dashboard/calendar`;
      const content = `
        ${appointmentDetailsBusiness(ctx)}
        ${financialBlock(ctx, "business")}
        <p style="margin:24px 0 0;">
          <a href="${escapeHtml(openUrl)}"
            style="${emailCtaStyle("#0b1324")}">
            Open appointment in ${escapeHtml(BRAND_NAME)}
          </a>
        </p>`;
      const depositRequired = Math.max(0, Number(ctx.depositRequiredCents ?? 0));
      const depositPaid = Math.max(0, Number(ctx.depositPaidCents ?? 0));
      const depositDueNow =
        ctx.depositDueNowCents != null
          ? Math.max(0, Math.round(Number(ctx.depositDueNowCents)))
          : Math.max(0, depositRequired - Math.min(depositRequired, depositPaid));
      return {
        key,
        subject: `New appointment booked — ${ctx.serviceName} on ${monthDay}`,
        html: layout(content, b, { headline: "New appointment booked" }),
        text: [
          `New appointment booked: ${ctx.customerName} — ${ctx.serviceName} with ${ctx.staffName} on ${whenLabel(ctx)}.`,
          `Total ${money(ctx.appointmentTotalCents ?? ctx.amountCents)}.`,
          depositRequired > 0
            ? `Deposit required: ${money(depositRequired)}`
            : null,
          depositRequired > 0
            ? `Deposit received: ${money(depositPaid)}`
            : null,
          depositRequired > 0
            ? `Deposit due now: ${money(depositDueNow)}`
            : null,
          ctx.paymentStatusLabel
            ? `Payment status: ${ctx.paymentStatusLabel}`
            : null,
          ctx.depositPaidCents && ctx.paymentMethodLabel
            ? `Deposit method: ${ctx.paymentMethodLabel}`
            : null,
          ctx.remainingBalanceCents != null
            ? `Balance remaining: ${money(ctx.remainingBalanceCents)}`
            : null,
          `Open ${openUrl}`,
        ]
          .filter(Boolean)
          .join(" "),
      };
    }
    default: {
      const body = ctx.customMessage || "Message from " + ctx.businessName;
      return {
        key: "custom",
        subject: ctx.notes || ctx.businessName,
        html: layout(`<p>${escapeHtml(body)}</p>${contactBlock(b, ctx)}`, b),
        text: body,
      };
    }
  }
}

export function renderSmsTemplate(
  key: string,
  ctx: AppointmentTemplateContext,
): RenderedTemplate {
  const when = whenLabel(ctx);
  switch (key) {
    case "appointment.confirmation":
      return {
        key,
        text: `${ctx.businessName}: Your ${ctx.serviceName} appointment is confirmed for ${whenLabel(ctx)} with ${ctx.staffName}. Reply or contact us if you need help.`,
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
