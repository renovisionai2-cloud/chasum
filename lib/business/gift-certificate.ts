import type { GiftCard } from "@/lib/business/types";
import { format } from "date-fns";

export type GiftCertificateBrand = {
  businessName: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine?: string | null;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatGiftCertificateText(
  card: GiftCard,
  brand: GiftCertificateBrand,
): string {
  const issued = format(new Date(card.created_at), "MMM d, yyyy");
  const expires = card.expires_at
    ? format(new Date(card.expires_at), "MMM d, yyyy")
    : "No expiry";

  return [
    "GIFT CERTIFICATE",
    brand.businessName,
    brand.addressLine ?? null,
    brand.phone ?? null,
    brand.email ?? null,
    "",
    `Code: ${card.code}`,
    `Original value: ${money(card.initial_balance_cents)}`,
    `Remaining balance: ${money(card.balance_cents)}`,
    `Issued: ${issued}`,
    `Expires: ${expires}`,
    `Status: ${card.status}`,
    card.notes ? `Note: ${card.notes}` : null,
    "",
    "Present this certificate when redeeming.",
    "Thank you for choosing us.",
  ]
    .filter((line) => line != null)
    .join("\n");
}

/** Printable / downloadable HTML certificate (no QR library — code is prominent). */
export function formatGiftCertificateHtml(
  card: GiftCard,
  brand: GiftCertificateBrand,
): string {
  const issued = format(new Date(card.created_at), "MMM d, yyyy");
  const expires = card.expires_at
    ? format(new Date(card.expires_at), "MMM d, yyyy")
    : "No expiry";
  const logo = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="" style="max-height:56px;margin:0 auto 16px;display:block;" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Gift Certificate · ${card.code}</title>
<style>
  @page { margin: 0.6in; }
  body { font-family: Georgia, "Times New Roman", serif; color: #0f172a; margin: 0; background: #f8fafc; }
  .sheet { max-width: 640px; margin: 24px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px 36px; }
  .eyebrow { letter-spacing: 0.22em; text-transform: uppercase; font-size: 11px; color: #64748b; text-align: center; }
  h1 { text-align: center; font-size: 28px; margin: 8px 0 4px; letter-spacing: -0.02em; }
  .biz { text-align: center; color: #475569; font-size: 14px; margin-bottom: 28px; }
  .code { text-align: center; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 26px; font-weight: 700; letter-spacing: 0.08em; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; margin: 20px 0; background: #f8fafc; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin-top: 20px; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; }
  .value { font-size: 18px; font-weight: 600; margin-top: 2px; }
  .footer { margin-top: 32px; text-align: center; font-size: 13px; color: #64748b; }
  @media print { body { background: #fff; } .sheet { border: none; margin: 0; max-width: none; } .no-print { display: none !important; } }
</style>
</head>
<body>
  <div class="sheet">
    ${logo}
    <p class="eyebrow">Gift certificate</p>
    <h1>${escapeHtml(brand.businessName)}</h1>
    <p class="biz">${[brand.addressLine, brand.phone, brand.email]
      .filter((v): v is string => Boolean(v))
      .map(escapeHtml)
      .join(" · ") || "&nbsp;"}</p>
    <div class="code">${escapeHtml(card.code)}</div>
    <div class="grid">
      <div><div class="label">Original value</div><div class="value">${money(card.initial_balance_cents)}</div></div>
      <div><div class="label">Remaining balance</div><div class="value">${money(card.balance_cents)}</div></div>
      <div><div class="label">Issued</div><div class="value">${issued}</div></div>
      <div><div class="label">Expires</div><div class="value">${expires}</div></div>
    </div>
    ${card.notes ? `<p class="footer">${escapeHtml(card.notes)}</p>` : ""}
    <p class="footer">Present this certificate when redeeming. Status: ${escapeHtml(card.status)}.</p>
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
