export const commercialReviewMessage = "Review this service’s tax and deposit settings, then confirm they are correct before enabling online booking.";

export function serviceWriteError(message: string): string {
  return message.includes("SERVICE_COMMERCIAL_REVIEW_REQUIRED") ? commercialReviewMessage : message;
}
