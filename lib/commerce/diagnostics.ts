/** Retain a bounded diagnostic cause without logging payloads or contact/secret values. */
export function commerceDiagnosticMessage(error: unknown): string {
  const message = error instanceof Error ? error.message
    : typeof error === "string" ? error
      : error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message : "Unknown commerce failure.";
  return message
    // Database detail/hint and provider payloads are not diagnostic message text.
    .split(/\r?\n|\b(?:details?|hint|payload|response body)\s*:/i, 1)[0]
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [secret]")
    .replace(/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+\b/g, "[secret]")
    .replace(/\b(?:token|secret|password|api[_ -]?key|authorization|customer|name|phone|address)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^,;\n]+)/gi, "[private value]")
    .replace(/'[^']*'|"[^"]*"/g, "[quoted value]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, "[id]")
    .replace(/\+?\d[\d ()-]{7,}\d/g, "[number]")
    .slice(0, 500);
}
