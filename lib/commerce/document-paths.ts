export function invoiceWorkspacePath(invoiceNumber: string): string {
  return `/dashboard/payments/invoices/${encodeURIComponent(invoiceNumber)}`;
}

export function receiptWorkspacePath(receiptNumber: string): string {
  return `/dashboard/payments/receipts/${encodeURIComponent(receiptNumber)}`;
}

export function customerWorkspacePath(customerId: string): string {
  return `/dashboard/clients/${customerId}`;
}

export function appointmentWorkspacePath(
  appointmentId: string,
  civilDate?: string | null,
): string {
  const date = civilDate?.trim();
  const q = new URLSearchParams({ appointment: appointmentId });
  if (date) q.set("date", date);
  return `/dashboard/calendar?${q.toString()}`;
}

export function collectPaymentPath(input: {
  customerId: string;
  appointmentId: string;
}): string {
  const q = new URLSearchParams({
    customer: input.customerId,
    appointment: input.appointmentId,
  });
  return `/dashboard/payments?${q.toString()}`;
}
