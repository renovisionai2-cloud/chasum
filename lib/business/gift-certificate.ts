import { formatMoneyCents, normalizeCurrency } from "@/lib/commerce/money";
import type { GiftCard } from "@/lib/business/types";
import { format } from "date-fns";

export type GiftCertificateBrand = {
  businessName: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine?: string | null;
  brandColor?: string | null;
  accentColor?: string | null;
  currency?: string | null;
};

export type GiftCertificateMessage = {
  recipientName?: string | null;
  senderName?: string | null;
  personalMessage?: string | null;
};

function money(cents: number, currency?: string | null) {
  return formatMoneyCents(cents, currency);
}

export function formatGiftCertificateText(
  card: GiftCard,
  brand: GiftCertificateBrand,
  message?: GiftCertificateMessage,
): string {
  const issued = format(new Date(card.created_at), "MMM d, yyyy");
  const expires = card.expires_at
    ? format(new Date(card.expires_at), "MMM d, yyyy")
    : "No expiry";
  const currency = normalizeCurrency(brand.currency);

  return [
    "GIFT CERTIFICATE",
    brand.businessName,
    brand.addressLine ?? null,
    brand.phone ?? null,
    brand.email ?? null,
    "",
    message?.recipientName ? `To: ${message.recipientName}` : null,
    message?.senderName ? `From: ${message.senderName}` : null,
    message?.personalMessage ? `Message: ${message.personalMessage}` : null,
    message?.recipientName || message?.senderName || message?.personalMessage
      ? ""
      : null,
    `Code: ${card.code}`,
    `Original value: ${money(card.initial_balance_cents, currency)}`,
    `Remaining balance: ${money(card.balance_cents, currency)}`,
    `Issued: ${issued}`,
    `Expires: ${expires}`,
    `Status: ${card.status}`,
    card.notes ? `Note: ${card.notes}` : null,
    "",
    "Present this certificate when redeeming.",
    `Thank you for choosing ${brand.businessName}.`,
  ]
    .filter((line) => line != null)
    .join("\n");
}

/** Printable / downloadable HTML certificate — branded, QR-ready layout. */
export function formatGiftCertificateHtml(
  card: GiftCard,
  brand: GiftCertificateBrand,
  message?: GiftCertificateMessage,
): string {
  const issued = format(new Date(card.created_at), "MMM d, yyyy");
  const expires = card.expires_at
    ? format(new Date(card.expires_at), "MMM d, yyyy")
    : "No expiry";
  const currency = normalizeCurrency(brand.currency);
  const brandColor = brand.brandColor || "#0f172a";
  const accent = brand.accentColor || "#b45309";
  const logo = brand.logoUrl
    ? `<img src="${escapeAttr(brand.logoUrl)}" alt="${escapeHtml(brand.businessName)}" style="max-height:64px;max-width:220px;margin:0 auto 18px;display:block;object-fit:contain;" />`
    : "";
  const recipient = message?.recipientName?.trim();
  const sender = message?.senderName?.trim();
  const personal = message?.personalMessage?.trim() || card.notes?.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Gift Certificate · ${escapeHtml(card.code)}</title>
<style>
  @page { margin: 0.5in; }
  body {
    margin: 0;
    background: linear-gradient(165deg, #f8f5f0 0%, #eef2f7 55%, #f4efe8 100%);
    color: #0f172a;
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  }
  .sheet {
    max-width: 700px;
    margin: 28px auto;
    background: #fffefb;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    border-radius: 4px;
    overflow: hidden;
  }
  .accent-bar {
    height: 8px;
    background: linear-gradient(90deg, ${escapeAttr(brandColor)}, ${escapeAttr(accent)});
  }
  .inner { padding: 44px 40px 36px; }
  .eyebrow {
    letter-spacing: 0.28em;
    text-transform: uppercase;
    font-size: 11px;
    color: ${escapeAttr(accent)};
    text-align: center;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-weight: 600;
  }
  h1 {
    text-align: center;
    font-size: 34px;
    margin: 10px 0 6px;
    letter-spacing: -0.03em;
    color: ${escapeAttr(brandColor)};
    font-weight: 600;
  }
  .biz {
    text-align: center;
    color: #64748b;
    font-size: 13px;
    margin-bottom: 28px;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .value-hero {
    text-align: center;
    font-size: 42px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: ${escapeAttr(brandColor)};
    margin: 8px 0 4px;
  }
  .value-label {
    text-align: center;
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #64748b;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .message {
    margin: 24px auto 8px;
    max-width: 460px;
    text-align: center;
    font-size: 16px;
    line-height: 1.55;
    color: #334155;
    font-style: italic;
  }
  .meta-row {
    display: flex;
    justify-content: center;
    gap: 28px;
    flex-wrap: wrap;
    margin: 18px 0 8px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 14px;
    color: #475569;
  }
  .code-wrap {
    margin: 28px auto 12px;
    max-width: 420px;
    border: 1.5px dashed ${escapeAttr(accent)};
    border-radius: 12px;
    padding: 18px 16px;
    background: linear-gradient(180deg, #fff 0%, #faf7f2 100%);
    text-align: center;
  }
  .code-label {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #64748b;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .code {
    margin-top: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: ${escapeAttr(brandColor)};
  }
  .qr-ready {
    margin: 10px auto 0;
    width: 88px;
    height: 88px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: grid;
    place-items: center;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
    background:
      repeating-linear-gradient(0deg, transparent, transparent 7px, #f1f5f9 7px, #f1f5f9 8px),
      repeating-linear-gradient(90deg, transparent, transparent 7px, #f1f5f9 7px, #f1f5f9 8px);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 24px;
    margin-top: 28px;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #64748b;
  }
  .value { font-size: 16px; font-weight: 600; margin-top: 3px; color: #0f172a; }
  .footer {
    margin-top: 32px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
    font-family: ui-sans-serif, system-ui, sans-serif;
    line-height: 1.5;
  }
  @media print {
    body { background: #fff; }
    .sheet { box-shadow: none; border: none; margin: 0; max-width: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="accent-bar"></div>
    <div class="inner">
      ${logo}
      <p class="eyebrow">Gift certificate</p>
      <h1>${escapeHtml(brand.businessName)}</h1>
      <p class="biz">${[brand.addressLine, brand.phone, brand.email]
        .filter((v): v is string => Boolean(v))
        .map(escapeHtml)
        .join(" · ") || "&nbsp;"}</p>
      <p class="value-label">Certificate value</p>
      <p class="value-hero">${money(card.initial_balance_cents, currency)}</p>
      ${
        recipient || sender
          ? `<div class="meta-row">${
              recipient ? `<span><strong>To</strong> ${escapeHtml(recipient)}</span>` : ""
            }${
              sender ? `<span><strong>From</strong> ${escapeHtml(sender)}</span>` : ""
            }</div>`
          : ""
      }
      ${personal ? `<p class="message">“${escapeHtml(personal)}”</p>` : ""}
      <div class="code-wrap">
        <div class="code-label">Redemption code</div>
        <div class="code">${escapeHtml(card.code)}</div>
        <div class="qr-ready" aria-hidden="true">QR ready</div>
      </div>
      <div class="grid">
        <div><div class="label">Remaining balance</div><div class="value">${money(card.balance_cents, currency)}</div></div>
        <div><div class="label">Status</div><div class="value">${escapeHtml(card.status)}</div></div>
        <div><div class="label">Issued</div><div class="value">${issued}</div></div>
        <div><div class="label">Expires</div><div class="value">${expires}</div></div>
      </div>
      <p class="footer">Present this certificate when redeeming.<br/>Thank you for choosing ${escapeHtml(brand.businessName)}.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

/** Business-friendly copy when outbound email is not configured. */
export function giftCertificateEmailConfigError(): string {
  return "Email delivery is not set up yet. Configure email in Communications (Business settings) before gift certificates can be emailed to customers. You can still print or download the certificate.";
}
